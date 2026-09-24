"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/db";
import { legalDocuments, navigationItems } from "@/db/schema";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { formDataToObject } from "@/lib/form-data";
import { legalSchema, navItemSchema } from "@/lib/validation/admin";

import { audit } from "../audit";
import { authorize } from "../auth/session";
import { revalidatePublicSite } from "../revalidate";
import { assertId, runAction } from "../run-action";

type Result = ActionResult<{ id?: string; redirectTo?: string }>;

export async function saveNavItem(id: string | null, _prev: unknown, fd: FormData): Promise<Result> {
  return runAction(async () => {
    assertId(id);
    const staff = await authorize("navigation.write");
    const input = navItemSchema.parse(formDataToObject(fd));
    const values = { ...input, isExternal: input.href.startsWith("https://") };
    const db = getDb();
    let nid = id;
    if (nid) {
      const rows = await db.update(navigationItems).set(values).where(eq(navigationItems.id, nid)).returning({ id: navigationItems.id });
      if (!rows.length) return fail("Item not found.");
    } else {
      const [row] = await db.insert(navigationItems).values({ ...values, sortOrder: 1000 }).returning({ id: navigationItems.id });
      nid = row!.id;
    }
    await audit(staff, { action: id ? "navigation.update" : "navigation.create", entityType: "navigation", entityId: nid, summary: `${input.location}: ${input.label}` });
    revalidatePublicSite();
    return ok({ id: nid }, "Navigation saved");
  });
}

const legalSlug = z.enum(["privacy-policy", "terms", "cookie-policy"]);

export async function saveLegal(slugRaw: string, _prev: unknown, fd: FormData): Promise<Result> {
  return runAction(async () => {
    const slug = legalSlug.parse(slugRaw);
    const staff = await authorize("legal.write");
    const input = legalSchema.parse(formDataToObject(fd));
    await getDb()
      .insert(legalDocuments)
      .values({ slug, ...input, updatedBy: staff.id })
      .onConflictDoUpdate({ target: legalDocuments.slug, set: { ...input, updatedBy: staff.id, updatedAt: new Date() } });
    await audit(staff, { action: "legal.update", entityType: "legal", entityId: slug, summary: `Updated ${input.title}` });
    revalidatePublicSite();
    return ok(undefined, "Saved");
  });
}
