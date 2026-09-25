import "server-only";

import { createClient } from "@supabase/supabase-js";

import { publicEnv, serverEnv } from "@/lib/env";

/**
 * Privileged Supabase client (secret / service_role key). Bypasses RLS.
 * Server-only: used for inviting users and deleting storage objects after an
 * authorization check in application code.
 */
export function createSupabaseAdminClient() {
  const key = serverEnv().supabaseSecretKey;
  if (!publicEnv.supabaseUrl || !key) {
    throw new Error("SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY) is not configured");
  }
  return createClient(publicEnv.supabaseUrl, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

export function isSupabaseAdminConfigured() {
  return Boolean(publicEnv.supabaseUrl && serverEnv().supabaseSecretKey);
}
