"use server";

import { and, eq, isNull, sql } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/db";
import { testimonials } from "@/db/schema";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { formDataToObject } from "@/lib/form-data";
import { manualTestimonialSchema } from "@/lib/validation/portal";

import { audit } from "../audit";
import { authorize } from "../auth/session";
import { revalidatePublicSite } from "../revalidate";
import { assertId, runAction } from "../run-action";

type Result = ActionResult<{ id?: string; redirectTo?: string }>;

/** Approve / reject. Rejecting (or un-approving) also unpublishes. */
export async function setTestimonialStatus(id: string, status: string): Promise<ActionResult> {
  return runAction(async () => {
    assertId(id);
    const s = z.enum(["pending", "approved", "rejected"]).parse(status);
    const staff = await authorize("testimonials.moderate");
    const rows = await getDb()
      .update(testimonials)
      .set({ status: s, ...(s !== "approved" ? { isPublished: false, isFeatured: false } : {}) })
      .where(and(eq(testimonials.id, id), isNull(testimonials.deletedAt)))
      .returning({ id: testimonials.id });
    if (!rows.length) return fail("Testimonial not found.");
    await audit(staff, { action: `testimonial.${s === "approved" ? "approve" : s === "rejected" ? "reject" : "reset"}`, entityType: "testimonial", entityId: id, summary: `Testimonial ${s}` });
    revalidatePublicSite();
    return ok(undefined, `Marked ${s}`);
  });
}

export async function setTestimonialPublished(id: string, publish: boolean): Promise<ActionResult> {
  return runAction(async () => {
    assertId(id);
    const staff = await authorize("testimonials.moderate");
    const db = getDb();
    const [t] = await db.select({ status: testimonials.status, consent: testimonials.consentToPublish }).from(testimonials).where(and(eq(testimonials.id, id), isNull(testimonials.deletedAt)));
    if (!t) return fail("Testimonial not found.");
    if (publish && (t.status !== "approved" || !t.consent)) return fail("Only approved testimonials whose author consented can be published.");
    await db
      .update(testimonials)
      .set({ isPublished: z.boolean().parse(publish), publishedAt: publish ? sql`coalesce(${testimonials.publishedAt}, now())` : undefined, ...(publish ? {} : { isFeatured: false }) })
      .where(eq(testimonials.id, id));
    await audit(staff, { action: publish ? "testimonial.publish" : "testimonial.unpublish", entityType: "testimonial", entityId: id, summary: publish ? "Published testimonial" : "Unpublished testimonial" });
    revalidatePublicSite();
    return ok(undefined, publish ? "Published" : "Unpublished");
  });
}

/** For testimonials received outside the portal (e.g. WhatsApp) — real quotes with the author's permission only. */
export async function saveManualTestimonial(id: string | null, _prev: unknown, fd: FormData): Promise<Result> {
  return runAction(async () => {
    assertId(id);
    const staff = await authorize("testimonials.moderate");
    const input = manualTestimonialSchema.parse(formDataToObject(fd));
    if (!input.consentToPublish) return fail("Please confirm the author agreed to publication.", { consentToPublish: ["Required for manually added testimonials"] });
    const db = getDb();
    let tid = id;
    if (tid) {
      const rows = await db.update(testimonials).set(input).where(and(eq(testimonials.id, tid), isNull(testimonials.deletedAt))).returning({ id: testimonials.id });
      if (!rows.length) return fail("Testimonial not found.");
    } else {
      const [row] = await db.insert(testimonials).values({ ...input, source: "manual", status: "approved", submittedBy: staff.id }).returning({ id: testimonials.id });
      tid = row!.id;
    }
    await audit(staff, { action: id ? "testimonial.update" : "testimonial.create", entityType: "testimonial", entityId: tid, summary: `${id ? "Updated" : "Added"} testimonial from ${input.authorName}` });
    revalidatePublicSite();
    return ok({ id: tid, redirectTo: "/admin/testimonials" }, "Testimonial saved");
  });
}
