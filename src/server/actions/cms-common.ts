"use server";

import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/db";
import { contentItems, projects, services, socialPlatforms, sponsorshipPackages, sponsorshipPartners, teamMembers, navigationItems } from "@/db/schema";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import type { Permission } from "@/lib/permissions";

import { audit } from "../audit";
import { authorize } from "../auth/session";
import { revalidatePublicSite } from "../revalidate";
import { runAction } from "../run-action";

/* eslint-disable @typescript-eslint/no-explicit-any -- table registry is intentionally heterogeneous */
const ENTITIES = {
  projects: { table: projects, label: "project", perm: "projects", flags: ["isPublished", "isFeatured", "isPinned"], softDelete: true },
  services: { table: services, label: "service", perm: "services", flags: ["isPublished", "isFeatured"], softDelete: true },
  team: { table: teamMembers, label: "team member", perm: "team", flags: ["isPublished", "isFeatured"], softDelete: true },
  content: { table: contentItems, label: "content item", perm: "content", flags: ["isPublished", "isFeatured", "isHighPerforming", "isCampaign", "isCaseStudy"], softDelete: true },
  packages: { table: sponsorshipPackages, label: "package", perm: "sponsorship", flags: ["isPublished"], softDelete: true },
  partners: { table: sponsorshipPartners, label: "partner", perm: "sponsorship", flags: ["isPublished"], softDelete: true },
  social: { table: socialPlatforms, label: "platform", perm: "content", flags: ["isActive"], softDelete: false },
  navigation: { table: navigationItems, label: "navigation item", perm: "navigation", flags: ["isVisible"], softDelete: false },
} as const;

type EntityKey = keyof typeof ENTITIES;
const entityKey = z.enum(Object.keys(ENTITIES) as [EntityKey, ...EntityKey[]]);

function perm(entity: EntityKey, kind: "publish" | "delete" | "write"): Permission {
  const base = ENTITIES[entity].perm;
  if (base === "navigation") return "navigation.write";
  return `${base}.${kind}` as Permission;
}

const FLAG_ACTIONS: Record<string, [string, string]> = {
  isPublished: ["publish", "unpublish"],
  isFeatured: ["feature", "unfeature"],
  isPinned: ["pin", "unpin"],
  isHighPerforming: ["highlight", "unhighlight"],
  isCampaign: ["campaign", "uncampaign"],
  isCaseStudy: ["case_study", "uncase_study"],
  isActive: ["activate", "deactivate"],
  isVisible: ["show", "hide"],
};

export async function setFlag(entityRaw: string, idRaw: string, flagRaw: string, valueRaw: boolean): Promise<ActionResult> {
  return runAction(async () => {
    const entity = entityKey.parse(entityRaw);
    const id = z.uuid().parse(idRaw);
    const value = z.boolean().parse(valueRaw);
    const cfg = ENTITIES[entity];
    if (!(cfg.flags as readonly string[]).includes(flagRaw)) return fail("Unknown flag.");
    const staff = await authorize(perm(entity, "publish"));
    const t = cfg.table as any;
    const patch: Record<string, unknown> = { [flagRaw]: value };
    if (flagRaw === "isPublished" && value && "publishedAt" in t) patch.publishedAt = sql`coalesce(${t.publishedAt}, now())`;
    const where = cfg.softDelete ? and(eq(t.id, id), isNull(t.deletedAt)) : eq(t.id, id);
    const rows = await getDb().update(t).set(patch).where(where).returning({ id: t.id });
    if (!rows.length) return fail("Item not found.");
    const [on, off] = FLAG_ACTIONS[flagRaw]!;
    await audit(staff, { action: `${cfg.label.replace(/ /g, "_")}.${value ? on : off}`, entityType: entity, entityId: id, summary: `${value ? on : off} ${cfg.label}` });
    revalidatePublicSite();
    return ok(undefined, "Updated");
  });
}

export async function reorder(entityRaw: string, idsRaw: string[]): Promise<ActionResult> {
  return runAction(async () => {
    const entity = entityKey.parse(entityRaw);
    const ids = z.array(z.uuid()).min(1).max(500).parse(idsRaw);
    const staff = await authorize(perm(entity, "publish"));
    const t = ENTITIES[entity].table as any;
    const db = getDb();
    await db.transaction(async (tx) => {
      // one statement: sort_order = position * 10
      const cases = sql.join(ids.map((id, i) => sql`when ${id}::uuid then ${(i + 1) * 10}`), sql` `);
      await tx.update(t).set({ sortOrder: sql`case ${t.id} ${cases} else ${t.sortOrder} end` }).where(inArray(t.id, ids));
    });
    await audit(staff, { action: `${ENTITIES[entity].label.replace(/ /g, "_")}.reorder`, entityType: entity, summary: `Reordered ${ids.length} ${ENTITIES[entity].label}s` });
    revalidatePublicSite();
    return ok(undefined, "Order saved");
  });
}

export async function softDelete(entityRaw: string, idRaw: string): Promise<ActionResult> {
  return runAction(async () => {
    const entity = entityKey.parse(entityRaw);
    const id = z.uuid().parse(idRaw);
    const cfg = ENTITIES[entity];
    const staff = await authorize(perm(entity, "delete"));
    const t = cfg.table as any;
    const db = getDb();
    const rows = cfg.softDelete
      ? await db.update(t).set({ deletedAt: new Date(), isPublished: false }).where(and(eq(t.id, id), isNull(t.deletedAt))).returning({ id: t.id })
      : await db.delete(t).where(eq(t.id, id)).returning({ id: t.id });
    if (!rows.length) return fail("Item not found.");
    await audit(staff, { action: `${cfg.label.replace(/ /g, "_")}.delete`, entityType: entity, entityId: id, summary: `Deleted ${cfg.label}` });
    revalidatePublicSite();
    return ok(undefined, "Deleted");
  });
}
