"use server";

import { and, eq, isNull } from "drizzle-orm";

import { getDb } from "@/db";
import { faqs } from "@/db/schema";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { formDataToObject } from "@/lib/form-data";
import { faqSchema } from "@/lib/validation/portal";

import { audit } from "../audit";
import { authorize } from "../auth/session";
import { revalidatePublicSite } from "../revalidate";
import { assertId, runAction } from "../run-action";

export async function saveFaq(id: string | null, _prev: unknown, fd: FormData): Promise<ActionResult<{ id?: string }>> {
  return runAction(async () => {
    assertId(id);
    const staff = await authorize("faqs.write");
    const input = faqSchema.parse(formDataToObject(fd));
    const db = getDb();
    let fid = id;
    if (fid) {
      const rows = await db.update(faqs).set(input).where(and(eq(faqs.id, fid), isNull(faqs.deletedAt))).returning({ id: faqs.id });
      if (!rows.length) return fail("FAQ not found.");
    } else {
      const [row] = await db.insert(faqs).values({ ...input, sortOrder: 1000 }).returning({ id: faqs.id });
      fid = row!.id;
    }
    await audit(staff, { action: id ? "faq.update" : "faq.create", entityType: "faq", entityId: fid, summary: input.question.slice(0, 80) });
    revalidatePublicSite();
    return ok({ id: fid }, "FAQ saved");
  });
}
