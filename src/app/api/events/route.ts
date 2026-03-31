// src/app/api/events/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase.server";
import { rateLimit } from "@/lib/rateLimit";
import { sanitizeText, sanitizeDate, sanitizeInt, ValidationError } from "@/lib/validate";
import bcrypt from "bcryptjs";

function genId(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export async function POST(req: NextRequest) {
  // 5 event creations per IP per hour
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  if (!rateLimit(`create:${ip}`, 5, 3600)) {
    return NextResponse.json({ error: "Trop de créations. Réessayez plus tard." }, { status: 429 });
  }

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "JSON invalide." }, { status: 400 }); }

  try {
    const b             = body as Record<string, unknown>;
    const title         = sanitizeText(b.title,         100);
    const organizer     = sanitizeText(b.organizer,      50);
    const organizer_pwd = sanitizeText(b.organizer_pwd, 128);
    const start_date    = sanitizeDate(b.start_date);
    const end_date      = sanitizeDate(b.end_date);
    const trip_min      = sanitizeInt(b.trip_min, 1, 330, "Durée min");
    const trip_max      = sanitizeInt(b.trip_max, 1, 330, "Durée max");

    if (start_date > end_date)
      return NextResponse.json({ error: "Dates invalides." }, { status: 400 });
    if (trip_min > trip_max)
      return NextResponse.json({ error: "Durée min > max." }, { status: 400 });

    const hash = await bcrypt.hash(organizer_pwd, 12);
    const id   = genId();

    const { error } = await getSupabaseServer().from("events").insert({
      id, title, organizer, organizer_pwd: hash,
      start_date, end_date, trip_min, trip_max,
    });

    if (error) {
      console.error("DB insert:", error.message);
      return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
    }

    return NextResponse.json({ id }, { status: 201 });

  } catch (e) {
    if (e instanceof ValidationError)
      return NextResponse.json({ error: e.message }, { status: 400 });
    console.error(e);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
