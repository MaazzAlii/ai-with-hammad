"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/db";
import { contactInquiries, inquiryNotes, profiles, sponsorshipInquiries } from "@/db/schema";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { formDataToObject } from "@/lib/form-data";
import { inquiryUpdateSchema, noteSchema } from "@/lib/validation/admin";

import { audit } from "../audit";
import { authorize } from "../auth/session";
import { runAction } from "../run-action";

const kindSchema = z.enum(["contact", "sponsorship"]);
type Result = ActionResult<{ id?: string; redirectTo?: string }>;

export async function updateInquiry(kindRaw: string, id: string, _prev: unknown, fd: FormData): Promise<Result> {
  return runAction(async () => {
    const kind = kindSchema.parse(kindRaw);
    z.uuid().parse(id);
    const staff = await authorize("inquiries.write");
    const input = inquiryUpdateSchema.parse(formDataToObject(fd));
    const db = getDb();
    if (input.assignedTo) {
      const [p] = await db.select({ active: profiles.isActive }).from(profiles).where(eq(profiles.id, input.assignedTo));
      if (!p?.active) return fail("Choose an active staff member.");
    }
    const t = kind === "contact" ? contactInquiries : sponsorshipInquiries;
    const [current] = await db.select({ status: t.status, contactedAt: t.contactedAt }).from(t).where(eq(t.id, id));
    if (!current) return fail("Inquiry not found.");
    const closed = ["won", "lost", "archived"].includes(input.status);
    await db
      .update(t)
      .set({
        ...input,
        contactedAt: current.contactedAt ?? (input.status !== "new" ? new Date() : null),
        closedAt: closed ? new Date() : null,
      })
      .where(eq(t.id, id));
    await audit(staff, {
      action: "inquiry.update",
      entityType: `${kind}_inquiry`,
      entityId: id,
      summary: current.status !== input.status ? `Status ${current.status} → ${input.status}` : "Updated inquiry",
      metadata: { status: input.status, priority: input.priority, assignedTo: input.assignedTo },
    });
    return ok({ id }, "Inquiry updated");
  });
}

export async function addInquiryNote(kindRaw: string, id: string, _prev: unknown, fd: FormData): Promise<Result> {
  return runAction(async () => {
    const kind = kindSchema.parse(kindRaw);
    z.uuid().parse(id);
    const staff = await authorize("inquiries.write");
    const { body } = noteSchema.parse(formDataToObject(fd));
    await getDb()
      .insert(inquiryNotes)
      .values({ body, authorId: staff.id, ...(kind === "contact" ? { contactInquiryId: id } : { sponsorshipInquiryId: id }) });
    await audit(staff, { action: "inquiry.note_add", entityType: `${kind}_inquiry`, entityId: id, summary: "Added note" });
    return ok({ id }, "Note added");
  });
}

export async function deleteInquiry(kindRaw: string, id: string): Promise<ActionResult> {
  return runAction(async () => {
    const kind = kindSchema.parse(kindRaw);
    z.uuid().parse(id);
    const staff = await authorize("inquiries.delete");
    const t = kind === "contact" ? contactInquiries : sponsorshipInquiries;
    const rows = await getDb().delete(t).where(eq(t.id, id)).returning({ id: t.id });
    if (!rows.length) return fail("Inquiry not found.");
    await audit(staff, { action: "inquiry.delete", entityType: `${kind}_inquiry`, entityId: id, summary: "Deleted inquiry" });
    return ok(undefined, "Inquiry deleted");
  });
}
