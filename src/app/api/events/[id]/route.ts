// src/app/api/events/[id]/route.ts
// Returns event info WITHOUT the password hash — never expose that to the client.
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase.server";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (id.length !== 6) return NextResponse.json({ error: "Code invalide." }, { status: 400 });

  const { data, error } = await getSupabaseServer()
    .from("events")
    // ⚠️ Explicitly select columns — organizer_pwd is intentionally excluded
    .select("id, title, organizer, start_date, end_date, trip_min, trip_max, created_at")
    .eq("id", id)
    .single();

  if (error || !data) return NextResponse.json({ error: "Introuvable." }, { status: 404 });
  return NextResponse.json(data);
}
