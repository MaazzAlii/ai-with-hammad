import "server-only";

import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { cache } from "react";

import { getDb, isDatabaseConfigured } from "@/db";
import { profiles, rolePermissions } from "@/db/schema";
import { isSupabaseConfigured } from "@/lib/env";
import type { Permission, Role } from "@/lib/permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { AuthError, ForbiddenError } from "../errors";

export type Staff = {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  isActive: boolean;
  permissions: ReadonlySet<Permission>;
};

/**
 * Resolves the signed-in staff member for this request.
 * Identity: verified with the Auth server (getUser), never from cookies alone.
 * Role/permissions: loaded from the database, never from the client or JWT metadata.
 * Returns null when signed out or when no profile exists.
 */
export const getCurrentStaff = cache(async (): Promise<Staff | null> => {
  if (!isSupabaseConfigured() || !isDatabaseConfigured()) return null;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;

  const db = getDb();
  const rows = await db
    .select({
      id: profiles.id,
      email: profiles.email,
      fullName: profiles.fullName,
      role: profiles.role,
      isActive: profiles.isActive,
      permission: rolePermissions.permissionKey,
    })
    .from(profiles)
    .leftJoin(rolePermissions, eq(rolePermissions.role, profiles.role))
    // Client-portal accounts are never staff, whatever their role column says.
    .where(and(eq(profiles.id, data.user.id), eq(profiles.kind, "staff")));
  if (rows.length === 0) return null;
  const first = rows[0]!;
  return {
    id: first.id,
    email: first.email,
    fullName: first.fullName,
    role: first.role,
    isActive: first.isActive,
    // Inactive users have no permissions at all.
    permissions: new Set(first.isActive ? (rows.map((r) => r.permission).filter(Boolean) as Permission[]) : []),
  };
});

export function can(staff: Staff | null | undefined, permission: Permission): boolean {
  return Boolean(staff?.isActive && staff.permissions.has(permission));
}

/** For server actions: throws AuthError / ForbiddenError (converted to ActionResult by runAction). */
export async function authorize(permission: Permission): Promise<Staff> {
  const staff = await getCurrentStaff();
  if (!staff) throw new AuthError();
  if (!staff.isActive) throw new ForbiddenError("Your account is not active.");
  if (!staff.permissions.has(permission)) throw new ForbiddenError();
  return staff;
}

/** For admin pages/layouts: redirects instead of throwing. */
export async function requireStaff(): Promise<Staff> {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/login");
  if (!staff.isActive || !staff.permissions.has("cms.read")) redirect("/login?error=inactive");
  return staff;
}

export async function requirePagePermission(permission: Permission): Promise<Staff> {
  const staff = await requireStaff();
  if (!staff.permissions.has(permission)) redirect(`/admin?denied=${encodeURIComponent(permission)}`);
  return staff;
}
