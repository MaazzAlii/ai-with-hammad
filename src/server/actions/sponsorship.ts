"use server";

import { and, eq, isNull } from "drizzle-orm";

import { getDb } from "@/db";
import { sponsorshipPackageRates, sponsorshipPackages, sponsorshipPartners } from "@/db/schema";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { formDataToObject } from "@/lib/form-data";
import { packageSchema, partnerSchema, ratesSchema } from "@/lib/validation/admin";

import { audit } from "../audit";
import { authorize } from "../auth/session";
import { revalidatePublicSite } from "../revalidate";
import { assertId, runAction } from "../run-action";

type Result = ActionResult<{ id?: string; redirectTo?: string }>;

export async function savePackage(id: string | null, _prev: unknown, fd: FormData): Promise<Result> {
  return runAction(async () => {
    assertId(id);
    const staff = await authorize("sponsorship.write");
    const obj = formDataToObject(fd);
    const input = packageSchema.parse({ ...obj, platforms: obj.platforms ?? [] });
    const canPublish = staff.permissions.has("sponsorship.publish");
    const { isPublished, ...base } = input;
    const values = { ...base, ...(canPublish ? { isPublished } : {}) };
    const db = getDb();
    let pid = id;
    if (pid) {
      const rows = await db.update(sponsorshipPackages).set(values).where(and(eq(sponsorshipPackages.id, pid), isNull(sponsorshipPackages.deletedAt))).returning({ id: sponsorshipPackages.id });
      if (!rows.length) return fail("Package not found.");
    } else {
      const [row] = await db.insert(sponsorshipPackages).values(values).returning({ id: sponsorshipPackages.id });
      pid = row!.id;
    }
    await audit(staff, { action: id ? "sponsorship_package.update" : "sponsorship_package.create", entityType: "sponsorship_package", entityId: pid, summary: `${id ? "Updated" : "Created"} package "${input.name}"` });
    revalidatePublicSite();
    return ok({ id: pid, redirectTo: id ? undefined : `/admin/sponsorship/packages/${pid}` }, "Package saved");
  });
}

/** INTERNAL pricing — requires sponsorship.rates. Never read by public code. */
export async function saveRates(packageId: string, _prev: unknown, fd: FormData): Promise<Result> {
  return runAction(async () => {
    assertId(packageId);
    const staff = await authorize("sponsorship.rates");
    const input = ratesSchema.parse(formDataToObject(fd));
    const db = getDb();
    const [pkg] = await db.select({ id: sponsorshipPackages.id }).from(sponsorshipPackages).where(eq(sponsorshipPackages.id, packageId));
    if (!pkg) return fail("Package not found.");
    await db
      .insert(sponsorshipPackageRates)
      .values({ packageId, ...input, updatedBy: staff.id })
      .onConflictDoUpdate({ target: sponsorshipPackageRates.packageId, set: { ...input, updatedBy: staff.id, updatedAt: new Date() } });
    // Audit without the values themselves (scrubMetadata also redacts "rate" keys).
    await audit(staff, { action: "sponsorship_rates.update", entityType: "sponsorship_package", entityId: packageId, summary: "Updated internal rates" });
    return ok({ id: packageId }, "Internal rates saved");
  });
}

export async function savePartner(id: string | null, _prev: unknown, fd: FormData): Promise<Result> {
  return runAction(async () => {
    assertId(id);
    const staff = await authorize("sponsorship.write");
    const input = partnerSchema.parse(formDataToObject(fd));
    const canPublish = staff.permissions.has("sponsorship.publish");
    const { isPublished, ...base } = input;
    const values = { ...base, ...(canPublish ? { isPublished } : {}) };
    const db = getDb();
    let pid = id;
    if (pid) {
      const rows = await db.update(sponsorshipPartners).set(values).where(and(eq(sponsorshipPartners.id, pid), isNull(sponsorshipPartners.deletedAt))).returning({ id: sponsorshipPartners.id });
      if (!rows.length) return fail("Partner not found.");
    } else {
      const [row] = await db.insert(sponsorshipPartners).values(values).returning({ id: sponsorshipPartners.id });
      pid = row!.id;
    }
    await audit(staff, { action: id ? "sponsorship_partner.update" : "sponsorship_partner.create", entityType: "sponsorship_partner", entityId: pid, summary: `${id ? "Updated" : "Created"} partner "${input.name}"` });
    revalidatePublicSite();
    return ok({ id: pid, redirectTo: id ? undefined : `/admin/sponsorship/partners/${pid}` }, "Partner saved");
  });
}
