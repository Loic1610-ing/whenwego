// src/lib/supabase.server.ts
// 🚫 NEVER import this file from "use client" components.
//    The service role key must stay server-side only.
//
// Next.js will throw a build error if a "use client" module
// imports this, because SUPABASE_SERVICE_ROLE_KEY has no
// NEXT_PUBLIC_ prefix and will be undefined in the browser.

import { createClient } from "@supabase/supabase-js";

export function getSupabaseServer() {
  const url        = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!serviceKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. " +
      "This function must only be called from API routes or Server Actions."
    );
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
