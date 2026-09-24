"use server";

import { and, eq, isNull } from "drizzle-orm";

import { getDb } from "@/db";
import { teamMembers, teamSocialLinks } from "@/db/schema";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { formDataToObject } from "@/lib/form-data";
import { teamMemberSchema } from "@/lib/validation/admin";

import { audit } from "../audit";
import { authorize } from "../auth/session";
import { revalidatePublicSite } from "../revalidate";
import { assertId, runAction } from "../run-action";

type Result = ActionResult<{ id?: string; redirectTo?: string }>;

async function save(id: string | null, fd: FormData): Promise<Result> {
  assertId(id);
  const staff = await authorize("team.write");
  const input = teamMemberSchema.parse(formDataToObject(fd));
  const canPublish = staff.permissions.has("team.publish");
  const { links, isPublished, isFeatured, ...base } = input;
  const flags = canPublish ? { isPublished, isFeatured } : {};
  const mid = await getDb().transaction(async (tx) => {
    let mid = id;
    if (mid) {
      const [ex] = await tx.select({ publishedAt: teamMembers.publishedAt }).from(teamMembers).where(and(eq(teamMembers.id, mid), isNull(teamMembers.deletedAt)));
      if (!ex) return null;
      await tx.update(teamMembers).set({ ...base, ...flags, ...(canPublish && isPublished && !ex.publishedAt ? { publishedAt: new Date() } : {}) }).where(eq(teamMembers.id, mid));
      await tx.delete(teamSocialLinks).where(eq(teamSocialLinks.teamMemberId, mid));
    } else {
      const [row] = await tx.insert(teamMembers).values({ ...base, ...flags, ...(canPublish && isPublished ? { publishedAt: new Date() } : {}) }).returning({ id: teamMembers.id });
      mid = row!.id;
    }
    if (links.length) await tx.insert(teamSocialLinks).values(links.map((l, i) => ({ ...l, teamMemberId: mid!, sortOrder: i })));
    return mid;
  });
  if (!mid) return fail("Team member not found.");
  await audit(staff, { action: id ? "team_member.update" : "team_member.create", entityType: "team", entityId: mid, summary: `${id ? "Updated" : "Created"} team member "${input.name}"` });
  revalidatePublicSite();
  return ok({ id: mid, redirectTo: id ? undefined : `/admin/team/${mid}` }, id ? "Team member saved" : "Team member created");
}

export async function createTeamMember(_prev: unknown, fd: FormData): Promise<Result> {
  return runAction(() => save(null, fd));
}
export async function updateTeamMember(id: string, _prev: unknown, fd: FormData): Promise<Result> {
  return runAction(() => save(id, fd));
}
