"use client";

import { createBrowserClient } from "@supabase/ssr";

import { publicEnv } from "@/lib/env";

/** Browser Supabase client (publishable key + user session cookies). Used only in admin UI for uploads. */
export function createSupabaseBrowserClient() {
  if (!publicEnv.supabaseUrl || !publicEnv.supabasePublishableKey) {
    throw new Error("Supabase is not configured");
  }
  return createBrowserClient(publicEnv.supabaseUrl, publicEnv.supabasePublishableKey);
}
