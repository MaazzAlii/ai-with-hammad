import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { publicEnv } from "@/lib/env";

/** Per-request Supabase client bound to the user's auth cookies (Server Components, Actions, Route Handlers). */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  if (!publicEnv.supabaseUrl || !publicEnv.supabasePublishableKey) {
    throw new Error("Supabase is not configured");
  }
  return createServerClient(publicEnv.supabaseUrl, publicEnv.supabasePublishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) cookieStore.set(name, value, options);
        } catch {
          // Called from a Server Component: cookies are read-only there. The proxy refreshes sessions.
        }
      },
    },
  });
}
