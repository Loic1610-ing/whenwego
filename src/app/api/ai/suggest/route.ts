// src/app/api/ai/suggest/route.ts
// ⚠️  ANTHROPIC_API_KEY is a server-only env var (no NEXT_PUBLIC_ prefix).
//     It is never sent to the browser.

import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  // Rate limit: max 10 AI calls / minute per IP
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  if (!rateLimit(`ai:${ip}`, 10, 60)) {
    return NextResponse.json({ error: "Trop de requêtes, réessayez dans une minute." }, { status: 429 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Service IA non configuré." }, { status: 503 });
  }

  const body = await req.json();
  const { eventSummary } = body;

  if (!eventSummary || typeof eventSummary !== "string" || eventSummary.length > 800) {
    return NextResponse.json({ error: "Données invalides." }, { status: 400 });
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type":    "application/json",
      "x-api-key":       apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model:      "claude-sonnet-4-20250514",
      max_tokens: 400,
      messages: [{
        role:    "user",
        content: `${eventSummary}\n\nRecommande en 3 phrases max (français, enthousiaste): destination + conseil pratique de réservation.`,
      }],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("Anthropic error:", err);
    return NextResponse.json({ error: "Erreur du service IA." }, { status: 502 });
  }

  const data = await res.json();
  const text = data.content?.[0]?.text ?? "";
  return NextResponse.json({ text });
}
