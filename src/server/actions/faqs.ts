"use server";

import { and, eq, isNull, sql } from "drizzle-orm";

import { getDb } from "@/db";
import { faqs, siteSettings } from "@/db/schema";
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

/**
 * Show/hide the FAQ section on the homepage and contact page. Merges `showFaq` into the
 * existing settings JSON so the rest of the homepage/contact settings are untouched.
 */
export async function saveFaqVisibility(_prev: unknown, fd: FormData): Promise<ActionResult> {
  return runAction(async () => {
    const staff = await authorize("faqs.write");
    const on = (v: FormDataEntryValue | null) => v === "on";
    const db = getDb();
    for (const [key, showFaq] of [["home", on(fd.get("home"))], ["contact", on(fd.get("contact"))]] as const) {
      const patch = JSON.stringify({ showFaq });
      await db
        .insert(siteSettings)
        .values({ key, value: { showFaq }, updatedBy: staff.id })
        .onConflictDoUpdate({
          target: siteSettings.key,
          set: { value: sql`site_settings.value || ${patch}::jsonb`, updatedBy: staff.id, updatedAt: new Date() },
        });
    }
    await audit(staff, { action: "settings.update", entityType: "settings", entityId: "faq-visibility", summary: "Updated FAQ section visibility" });
    revalidatePublicSite();
    return ok(undefined, "FAQ visibility saved");
  });
}
