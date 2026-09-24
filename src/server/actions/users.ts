"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/db";
import { profiles } from "@/db/schema";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { publicEnv } from "@/lib/env";
import { formDataToObject } from "@/lib/form-data";
import { canManageRole } from "@/lib/permissions";
import { createSupabaseAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { inviteUserSchema, userUpdateSchema } from "@/lib/validation/admin";

import { audit } from "../audit";
import { authorize } from "../auth/session";
import { runAction } from "../run-action";

type Result = ActionResult<{ id?: string; redirectTo?: string }>;

/** Invite-only onboarding: the service key creates the auth user and sends the invite email. */
export async function inviteUser(_prev: unknown, fd: FormData): Promise<Result> {
  return runAction(async () => {
    const staff = await authorize("users.manage");
    const input = inviteUserSchema.parse(formDataToObject(fd));
    if (!canManageRole(staff.role, "viewer", input.role)) return fail("You cannot grant that role.");
    if (!isSupabaseAdminConfigured()) return fail("Inviting users requires SUPABASE_SECRET_KEY on the server.");
    const db = getDb();
    const [existing] = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.email, input.email));
    if (existing) return fail("A user with this email already exists.");
    const { data, error } = await createSupabaseAdminClient().auth.admin.inviteUserByEmail(input.email, {
      data: { full_name: input.fullName },
      redirectTo: `${publicEnv.siteUrl}/auth/set-password`,
    });
    if (error || !data.user) return fail(`Invite failed: ${error?.message ?? "unknown error"}`);
    // The auth trigger created an inactive viewer profile; apply the chosen role.
    await db.update(profiles).set({ role: input.role, isActive: true, fullName: input.fullName }).where(eq(profiles.id, data.user.id));
    await audit(staff, { action: "user.invite", entityType: "user", entityId: data.user.id, summary: `Invited ${input.email} as ${input.role}` });
    return ok({ id: data.user.id }, `Invitation sent to ${input.email}`);
  });
}

export async function updateUser(id: string, _prev: unknown, fd: FormData): Promise<Result> {
  return runAction(async () => {
    z.uuid().parse(id);
    const staff = await authorize("users.manage");
    const input = userUpdateSchema.parse(formDataToObject(fd));
    const db = getDb();
    const [target] = await db.select().from(profiles).where(eq(profiles.id, id));
    if (!target || target.kind !== "staff") return fail("User not found.");
    if (target.id === staff.id && (input.role !== target.role || !input.isActive)) return fail("You cannot change your own role or deactivate yourself.");
    if ((input.role !== target.role || input.isActive !== target.isActive) && !canManageRole(staff.role, target.role, input.role)) {
      return fail("You do not have permission to change this user's role or status.");
    }
    try {
      await db.update(profiles).set(input).where(eq(profiles.id, id));
    } catch (e) {
      if (e instanceof Error && /last active owner/.test(`${e.message} ${(e as { cause?: Error }).cause?.message ?? ""}`)) return fail("The last active owner cannot be demoted or deactivated.");
      throw e;
    }
    if (input.role !== target.role) await audit(staff, { action: "user.role_change", entityType: "user", entityId: id, summary: `${target.email}: ${target.role} → ${input.role}` });
    if (input.isActive !== target.isActive) await audit(staff, { action: input.isActive ? "user.activate" : "user.deactivate", entityType: "user", entityId: id, summary: `${input.isActive ? "Activated" : "Deactivated"} ${target.email}` });
    if (!input.isActive && isSupabaseAdminConfigured()) {
      // Revoke sessions so a deactivated user is signed out everywhere.
      await createSupabaseAdminClient().auth.admin.signOut(id).catch(() => undefined);
    }
    return ok({ id }, "User updated");
  });
}
