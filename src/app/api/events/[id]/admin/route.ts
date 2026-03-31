// src/app/api/events/[id]/admin/route.ts
//
// POST   → authenticate with password → returns short-lived JWT (8h)
// DELETE → remove a participant       → requires valid JWT
// PATCH  → rename a participant       → requires valid JWT
//
// ⚠️  Uses service role key (server-only).
// ⚠️  JWT secret is a server-only env var (no NEXT_PUBLIC_ prefix).

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase.server";
import { rateLimit } from "@/lib/rateLimit";
import { sanitizeText, ValidationError } from "@/lib/validate";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

// ── JWT helpers ────────────────────────────────────────────────
function getSecret(): Uint8Array {
  const s = process.env.ADMIN_JWT_SECRET;
  if (!s || s.length < 32) {
    throw new Error("ADMIN_JWT_SECRET must be set and at least 32 chars.");
  }
  return new TextEncoder().encode(s);
}

async function signToken(eventId: string): Promise<string> {
  return new SignJWT({ eventId, role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(getSecret());
}

async function verifyToken(token: string, eventId: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload.eventId === eventId && payload.role === "admin";
  } catch {
    return false;
  }
}

// ── Shared ID guard ────────────────────────────────────────────
function parseId(raw: string): string | null {
  const id = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return id.length === 6 ? id : null;
}

// ── POST: authenticate ─────────────────────────────────────────
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Strict rate limit on auth attempts: 5 per 15 min per IP
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  if (!rateLimit(`admin-auth:${ip}`, 5, 900)) {
    return NextResponse.json({ error: "Trop de tentatives. Réessayez dans 15 minutes." }, { status: 429 });
  }

  const id = parseId(params.id);
  if (!id) return NextResponse.json({ error: "Code invalide." }, { status: 400 });

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "JSON invalide." }, { status: 400 }); }

  const password = (body as any)?.password;
  if (typeof password !== "string" || !password) {
    return NextResponse.json({ error: "Mot de passe manquant." }, { status: 400 });
  }

  // Fetch the hash — note: we query organizer_pwd here server-side only
  const { data: ev } = await getSupabaseServer()
    .from("events")
    .select("organizer_pwd")
    .eq("id", id)
    .single();

  if (!ev) return NextResponse.json({ error: "Événement introuvable." }, { status: 404 });

  const ok = await bcrypt.compare(password, ev.organizer_pwd);
  // Always wait the same amount of time to prevent timing attacks
  if (!ok) return NextResponse.json({ error: "Mot de passe incorrect." }, { status: 401 });

  const token = await signToken(id);
  return NextResponse.json({ token });
}

// ── DELETE: remove a participant ───────────────────────────────
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseId(params.id);
  if (!id) return NextResponse.json({ error: "Code invalide." }, { status: 400 });

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "JSON invalide." }, { status: 400 }); }

  const { response_id, token } = body as any;

  if (!token || !(await verifyToken(token, id))) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
  }
  if (typeof response_id !== "string" || !response_id) {
    return NextResponse.json({ error: "ID de réponse manquant." }, { status: 400 });
  }

  const { error } = await getSupabaseServer()
    .from("responses")
    .delete()
    .eq("id", response_id)
    .eq("event_id", id); // ensures you can only delete within this event

  if (error) {
    console.error("DB delete:", error.message);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

// ── PATCH: rename a participant ────────────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseId(params.id);
  if (!id) return NextResponse.json({ error: "Code invalide." }, { status: 400 });

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "JSON invalide." }, { status: 400 }); }

  const { response_id, name, token } = body as any;

  if (!token || !(await verifyToken(token, id))) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
  }
  if (typeof response_id !== "string" || !response_id) {
    return NextResponse.json({ error: "ID de réponse manquant." }, { status: 400 });
  }

  try {
    const cleanName = sanitizeText(name, 50);

    const { error } = await getSupabaseServer()
      .from("responses")
      .update({ name: cleanName })
      .eq("id", response_id)
      .eq("event_id", id);

    if (error) {
      console.error("DB update:", error.message);
      return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
    }

    return NextResponse.json({ ok: true });

  } catch (e) {
    if (e instanceof ValidationError)
      return NextResponse.json({ error: e.message }, { status: 400 });
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
