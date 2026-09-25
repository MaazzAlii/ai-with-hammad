"use server";

import { and, eq, isNull } from "drizzle-orm";

import { getDb } from "@/db";
import { contentItems, contentMetrics, socialPlatforms } from "@/db/schema";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { parseEmbed } from "@/lib/embeds";
import { formDataToObject } from "@/lib/form-data";
import { contentItemSchema, contentMetricsSchema, socialPlatformSchema } from "@/lib/validation/admin";

import { audit } from "../audit";
import { authorize } from "../auth/session";
import { revalidatePublicSite } from "../revalidate";
import { assertId, runAction } from "../run-action";

type Result = ActionResult<{ id?: string; redirectTo?: string }>;

async function saveItem(id: string | null, fd: FormData): Promise<Result> {
  assertId(id);
  const staff = await authorize("content.write");
  const input = contentItemSchema.parse(formDataToObject(fd));
  if (input.embedUrl && !parseEmbed(input.embedUrl)) {
    return fail("Please correct the highlighted fields.", { embedUrl: ["Unsupported embed URL. Use a YouTube, Vimeo, TikTok, Instagram, Facebook or LinkedIn post URL."] });
  }
  const canPublish = staff.permissions.has("content.publish");
  const { isPublished, isFeatured, isHighPerforming, isCampaign, isCaseStudy, performanceRank, ...base } = input;
  const flags = canPublish ? { isPublished, isFeatured, isHighPerforming, isCampaign, isCaseStudy, performanceRank } : {};
  const db = getDb();
  let cid = id;
  if (cid) {
    const [ex] = await db.select({ publishedAt: contentItems.publishedAt }).from(contentItems).where(and(eq(contentItems.id, cid), isNull(contentItems.deletedAt)));
    if (!ex) return fail("Content item not found.");
    await db.update(contentItems).set({ ...base, ...flags, ...(canPublish && isPublished && !ex.publishedAt ? { publishedAt: new Date() } : {}) }).where(eq(contentItems.id, cid));
  } else {
    const [row] = await db.insert(contentItems).values({ ...base, ...flags, ...(canPublish && isPublished ? { publishedAt: new Date() } : {}) }).returning({ id: contentItems.id });
    cid = row!.id;
  }
  await audit(staff, { action: id ? "content.update" : "content.create", entityType: "content", entityId: cid, summary: `${id ? "Updated" : "Created"} content "${input.title}"` });
  revalidatePublicSite();
  return ok({ id: cid, redirectTo: id ? undefined : `/admin/content/${cid}` }, id ? "Content saved" : "Content created");
}

export async function createContentItem(_prev: unknown, fd: FormData): Promise<Result> {
  return runAction(() => saveItem(null, fd));
}
export async function updateContentItem(id: string, _prev: unknown, fd: FormData): Promise<Result> {
  return runAction(() => saveItem(id, fd));
}

/** Manual metric snapshot (official API providers can write the same table later). */
export async function addContentMetrics(contentItemId: string, _prev: unknown, fd: FormData): Promise<Result> {
  return runAction(async () => {
    assertId(contentItemId);
    const staff = await authorize("content.write");
    const input = contentMetricsSchema.parse(formDataToObject(fd));
    if ([input.views, input.likes, input.comments, input.shares, input.engagementRate].every((v) => v == null)) return fail("Enter at least one metric.");
    const { capturedAt, ...values } = input;
    await getDb().insert(contentMetrics).values({ ...values, contentItemId, capturedAt: capturedAt ? new Date(`${capturedAt}T12:00:00Z`) : new Date(), source: "manual" });
    await audit(staff, { action: "content.metrics_add", entityType: "content", entityId: contentItemId, summary: "Recorded content metrics" });
    revalidatePublicSite();
    return ok({ id: contentItemId }, "Metrics recorded");
  });
}

export async function saveSocialPlatform(id: string | null, _prev: unknown, fd: FormData): Promise<Result> {
  return runAction(async () => {
    assertId(id);
    const staff = await authorize("content.write");
    const input = socialPlatformSchema.parse(formDataToObject(fd));
    const db = getDb();
    let pid = id;
    if (pid) {
      const rows = await db.update(socialPlatforms).set(input).where(eq(socialPlatforms.id, pid)).returning({ id: socialPlatforms.id });
      if (!rows.length) return fail("Platform not found.");
    } else {
      const [row] = await db.insert(socialPlatforms).values(input).returning({ id: socialPlatforms.id });
      pid = row!.id;
    }
    await audit(staff, { action: id ? "social.update" : "social.create", entityType: "social", entityId: pid, summary: `${id ? "Updated" : "Added"} ${input.platform} @${input.handle}` });
    revalidatePublicSite();
    return ok({ id: pid, redirectTo: "/admin/social" }, "Platform saved");
  });
}
