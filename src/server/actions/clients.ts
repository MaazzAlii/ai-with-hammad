"use server";

import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/db";
import { clients, profiles } from "@/db/schema";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { publicEnv } from "@/lib/env";
import { formDataToObject } from "@/lib/form-data";
import { createSupabaseAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { clientSchema, inviteClientUserSchema } from "@/lib/validation/portal";

import { audit } from "../audit";
import { authorize } from "../auth/session";
import { assertId, runAction } from "../run-action";

type Result = ActionResult<{ id?: string; redirectTo?: string }>;

export async function saveClient(id: string | null, _prev: unknown, fd: FormData): Promise<Result> {
  return runAction(async () => {
    assertId(id);
    const staff = await authorize("clients.manage");
    const input = clientSchema.parse(formDataToObject(fd));
    const db = getDb();
    let cid = id;
    if (cid) {
      const rows = await db.update(clients).set(input).where(eq(clients.id, cid)).returning({ id: clients.id });
      if (!rows.length) return fail("Client not found.");
    } else {
      const [row] = await db.insert(clients).values(input).returning({ id: clients.id });
      cid = row!.id;
    }
    await audit(staff, { action: id ? "client.update" : "client.create", entityType: "client", entityId: cid, summary: `${id ? "Updated" : "Created"} client ${input.companyName}` });
    return ok({ id: cid, redirectTo: id ? undefined : `/admin/clients/${cid}` }, id ? "Client saved" : "Client created");
  });
}

/** Creates a portal login for a client contact and emails them an invite link. */
export async function inviteClientUser(clientId: string, _prev: unknown, fd: FormData): Promise<Result> {
  return runAction(async () => {
    assertId(clientId);
    const staff = await authorize("clients.manage");
    const input = inviteClientUserSchema.parse(formDataToObject(fd));
    if (!isSupabaseAdminConfigured()) return fail("Inviting clients requires SUPABASE_SECRET_KEY on the server.");
    const db = getDb();
    const [c] = await db.select({ id: clients.id, companyName: clients.companyName }).from(clients).where(eq(clients.id, clientId));
    if (!c) return fail("Client not found.");
    const [existing] = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.email, input.email));
    if (existing) return fail("An account with this email already exists.");
    const { data, error } = await createSupabaseAdminClient().auth.admin.inviteUserByEmail(input.email, {
      data: { full_name: input.fullName },
      redirectTo: `${publicEnv.siteUrl}/auth/set-password`,
    });
    if (error || !data.user) return fail(`Invite failed: ${error?.message ?? "unknown error"}`);
    // Portal accounts are kind=client: they never receive staff permissions.
    await db.update(profiles).set({ kind: "client", clientId, isActive: true, fullName: input.fullName, role: "viewer" }).where(eq(profiles.id, data.user.id));
    await audit(staff, { action: "client.user_invite", entityType: "client", entityId: clientId, summary: `Invited ${input.email} to the portal (${c.companyName})` });
    return ok({ id: data.user.id }, `Invitation sent to ${input.email}`);
  });
}

export async function setClientUserActive(profileId: string, active: boolean): Promise<ActionResult> {
  return runAction(async () => {
    assertId(profileId);
    const isActive = z.boolean().parse(active);
    const staff = await authorize("clients.manage");
    const rows = await getDb()
      .update(profiles)
      .set({ isActive })
      .where(and(eq(profiles.id, profileId), eq(profiles.kind, "client")))
      .returning({ email: profiles.email });
    if (!rows.length) return fail("Portal user not found.");
    if (!isActive && isSupabaseAdminConfigured()) await createSupabaseAdminClient().auth.admin.signOut(profileId).catch(() => undefined);
    await audit(staff, { action: isActive ? "client.user_activate" : "client.user_deactivate", entityType: "client_user", entityId: profileId, summary: `${isActive ? "Activated" : "Deactivated"} portal user ${rows[0]!.email}` });
    return ok(undefined, isActive ? "Portal access enabled" : "Portal access disabled");
  });
}
