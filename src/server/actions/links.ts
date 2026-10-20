"use server";

import { and, eq, isNull, sql } from "drizzle-orm";

import { getDb } from "@/db";
import { bioLinks } from "@/db/schema";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { formDataToObject } from "@/lib/form-data";
import { bioLinkSchema } from "@/lib/validation/admin";

import { audit } from "../audit";
import { authorize } from "../auth/session";
import { revalidatePublicSite } from "../revalidate";
import { assertId, runAction } from "../run-action";

export async function saveBioLink(id: string | null, _prev: unknown, fd: FormData): Promise<ActionResult<{ id?: string }>> {
  return runAction(async () => {
    assertId(id);
    const staff = await authorize("links.write");
    const raw = formDataToObject(fd);
    const input = bioLinkSchema.parse(raw);
    const db = getDb();
    let lid = id;
    if (lid) {
      const rows = await db.update(bioLinks).set(input).where(and(eq(bioLinks.id, lid), isNull(bioLinks.deletedAt))).returning({ id: bioLinks.id });
      if (!rows.length) return fail("Link not found.");
    } else {
      const placement = typeof raw.placement === "string" ? raw.placement : "top";
      let sortOrder = 10;
      if (placement === "top") {
        const [minRow] = await db
          .select({ min: sql<number>`coalesce(min(${bioLinks.sortOrder}), 10)` })
          .from(bioLinks)
          .where(isNull(bioLinks.deletedAt));
        sortOrder = (minRow?.min ?? 10) - 10;
      } else {
        const [maxRow] = await db
          .select({ max: sql<number>`coalesce(max(${bioLinks.sortOrder}), 0)` })
          .from(bioLinks)
          .where(isNull(bioLinks.deletedAt));
        sortOrder = (maxRow?.max ?? 0) + 10;
      }
      const [row] = await db.insert(bioLinks).values({ ...input, sortOrder }).returning({ id: bioLinks.id });
      lid = row!.id;
    }
    await audit(staff, { action: id ? "link.update" : "link.create", entityType: "link", entityId: lid, summary: input.title.slice(0, 80) });
    revalidatePublicSite();
    return ok({ id: lid }, "Link saved");
  });
}
