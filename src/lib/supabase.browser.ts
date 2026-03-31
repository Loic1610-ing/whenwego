// src/lib/supabase.browser.ts
// ✅ Safe to import in "use client" components.
// Uses the public anon key only.

import { createClient } from "@supabase/supabase-js";

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

let _client: ReturnType<typeof createClient> | null = null;

export function getSupabaseBrowser() {
  if (!_client) _client = createClient(url, anon);
  return _client;
}

// ─── Shared types (safe to export from browser module) ────────────
export interface DateRange   { start: string; end: string; }
export interface Destination { country: string; flag: string; cities: string[]; }

export interface Event {
  id:         string;
  title:      string;
  organizer:  string;
  start_date: string;
  end_date:   string;
  trip_min:   number;
  trip_max:   number;
  created_at: string;
  // organizer_pwd is intentionally omitted — never sent to the client
}

export interface Response {
  id:           string;
  event_id:     string;
  name:         string;
  ranges:       DateRange[];
  destinations: Destination[];
  budget:       string;
  submitted_at: string;
}
