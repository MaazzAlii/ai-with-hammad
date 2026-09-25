"use server";

import { and, eq, isNull } from "drizzle-orm";

import { getDb } from "@/db";
import { serviceFeatures, services } from "@/db/schema";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { formDataToObject } from "@/lib/form-data";
import { serviceSchema } from "@/lib/validation/admin";

import { audit } from "../audit";
import { authorize } from "../auth/session";
import { revalidatePublicSite } from "../revalidate";
import { assertId, runAction } from "../run-action";

type Result = ActionResult<{ id?: string; redirectTo?: string }>;

async function save(id: string | null, fd: FormData): Promise<Result> {
  assertId(id);
  const staff = await authorize("services.write");
  const input = serviceSchema.parse(formDataToObject(fd));
  const canPublish = staff.permissions.has("services.publish");
  const { features, isPublished, isFeatured, ...base } = input;
  const flags = canPublish ? { isPublished, isFeatured } : {};
  const db = getDb();
  const sid = await db.transaction(async (tx) => {
    let sid = id;
    if (sid) {
      const [ex] = await tx.select({ publishedAt: services.publishedAt }).from(services).where(and(eq(services.id, sid), isNull(services.deletedAt)));
      if (!ex) return null;
      await tx.update(services).set({ ...base, ...flags, ...(canPublish && isPublished && !ex.publishedAt ? { publishedAt: new Date() } : {}) }).where(eq(services.id, sid));
      await tx.delete(serviceFeatures).where(eq(serviceFeatures.serviceId, sid));
    } else {
      const [row] = await tx.insert(services).values({ ...base, ...flags, ...(canPublish && isPublished ? { publishedAt: new Date() } : {}) }).returning({ id: services.id });
      sid = row!.id;
    }
    if (features.length) await tx.insert(serviceFeatures).values(features.map((f, i) => ({ ...f, serviceId: sid!, sortOrder: i })));
    return sid;
  });
  if (!sid) return fail("Service not found.");
  await audit(staff, { action: id ? "service.update" : "service.create", entityType: "service", entityId: sid, summary: `${id ? "Updated" : "Created"} service "${input.title}"` });
  revalidatePublicSite();
  return ok({ id: sid, redirectTo: id ? undefined : `/admin/services/${sid}` }, id ? "Service saved" : "Service created");
}

export async function createService(_prev: unknown, fd: FormData): Promise<Result> {
  return runAction(() => save(null, fd));
}
export async function updateService(id: string, _prev: unknown, fd: FormData): Promise<Result> {
  return runAction(() => save(id, fd));
}
