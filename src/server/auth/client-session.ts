import "server-only";

import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { cache } from "react";

import { getDb, isDatabaseConfigured } from "@/db";
import { clients, profiles } from "@/db/schema";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { AuthError, ForbiddenError } from "../errors";

export type ClientUser = { id: string; email: string; fullName: string; clientId: string; companyName: string };

/** Signed-in client-portal user (verified with the Auth server), or null. */
export const getCurrentClientUser = cache(async (): Promise<ClientUser | null> => {
  if (!isSupabaseConfigured() || !isDatabaseConfigured()) return null;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  const [row] = await getDb()
    .select({ id: profiles.id, email: profiles.email, fullName: profiles.fullName, clientId: clients.id, companyName: clients.companyName })
    .from(profiles)
    .innerJoin(clients, eq(clients.id, profiles.clientId))
    .where(and(eq(profiles.id, data.user.id), eq(profiles.kind, "client"), eq(profiles.isActive, true), eq(clients.isActive, true)));
  return row ?? null;
});

export async function requireClient(): Promise<ClientUser> {
  const user = await getCurrentClientUser();
  if (!user) redirect("/portal/login");
  return user;
}

/** For portal server actions. */
export async function authorizeClient(): Promise<ClientUser> {
  const user = await getCurrentClientUser();
  if (!user) {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    throw data.user ? new ForbiddenError("Your client account is not active.") : new AuthError();
  }
  return user;
}
