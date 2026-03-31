// src/app/api/events/[id]/responses/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase.server";
import { rateLimit } from "@/lib/rateLimit";
import {
  sanitizeText, sanitizeBudget, sanitizeRanges,
  sanitizeDestinations, ValidationError,
} from "@/lib/validate";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (id.length !== 6) return NextResponse.json({ error: "Code invalide." }, { status: 400 });

  const { data, error } = await getSupabaseServer()
    .from("responses")
    .select("id, event_id, name, ranges, destinations, budget, submitted_at")
    .eq("event_id", id)
    .order("submitted_at", { ascending: true });

  if (error) {
    console.error("DB select:", error.message);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
  return NextResponse.json(data ?? []);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // 20 submissions per IP per hour (generous for group use)
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  if (!rateLimit(`submit:${ip}`, 20, 3600)) {
    return NextResponse.json({ error: "Trop de soumissions. Réessayez plus tard." }, { status: 429 });
  }

  const id = params.id.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (id.length !== 6) return NextResponse.json({ error: "Code invalide." }, { status: 400 });

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "JSON invalide." }, { status: 400 }); }

  try {
    const b            = body as Record<string, unknown>;
    const name         = sanitizeText(b.name, 50);
    const budget       = sanitizeBudget(b.budget);
    const ranges       = sanitizeRanges(b.ranges);
    const destinations = sanitizeDestinations(b.destinations);

    // Verify the event exists before inserting
    const { data: ev } = await getSupabaseServer()
      .from("events").select("id").eq("id", id).single();
    if (!ev) return NextResponse.json({ error: "Événement introuvable." }, { status: 404 });

    const { data, error } = await getSupabaseServer()
      .from("responses")
      .insert({ event_id: id, name, ranges, destinations, budget })
      .select("id, event_id, name, ranges, destinations, budget, submitted_at")
      .single();

    if (error) {
      console.error("DB insert:", error.message);
      return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });

  } catch (e) {
    if (e instanceof ValidationError)
      return NextResponse.json({ error: e.message }, { status: 400 });
    console.error(e);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
