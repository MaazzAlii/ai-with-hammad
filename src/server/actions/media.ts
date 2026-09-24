"use server";

import { and, eq, isNull } from "drizzle-orm";

import { getDb } from "@/db";
import { mediaAssets } from "@/db/schema";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { formDataToObject } from "@/lib/form-data";
import { BUCKETS, isBucketId, type BucketId } from "@/lib/media/buckets";
import { buildObjectPath, isValidObjectPath, kindFromMime, validateUpload } from "@/lib/media/validation";
import { finalizeUploadSchema, mediaUpdateSchema } from "@/lib/validation/admin";

import { audit } from "../audit";
import { authorize } from "../auth/session";
import { getMedia, listMedia, mediaUsage, type AdminMedia, type MediaQuery } from "../dal/admin/media";
import { UserFacingError } from "../errors";
import { revalidatePublicSite } from "../revalidate";
import { assertId, runAction } from "../run-action";
import { createSignedUrl, getStoredObject, removeStoredObjects } from "../storage";

type PrepareInput = { bucket: string; filename: string; mimeType: string; size: number; width?: number | null; height?: number | null; durationSeconds?: number | null };

/** Step 1: authorize + validate the declared file, return the object path to upload to. */
export async function prepareUpload(input: PrepareInput): Promise<ActionResult<{ path: string }>> {
  return runAction(async () => {
    const staff = await authorize("media.upload");
    if (!isBucketId(input.bucket)) return fail("Unknown bucket.");
    const errors = validateUpload({ ...input, bucket: input.bucket }, { canUploadSiteAssets: staff.permissions.has("settings.write") });
    if (errors.length) return fail(errors.join(" "));
    return ok({ path: buildObjectPath(input.filename, crypto.randomUUID()) });
  });
}

/**
 * Step 2 (after the browser uploaded directly to Storage): verify the stored
 * object really exists and matches what was declared, then record metadata.
 */
export async function finalizeUpload(raw: unknown): Promise<ActionResult<{ media: AdminMedia }>> {
  return runAction(async () => {
    const input = finalizeUploadSchema.parse(raw);
    const staff = await authorize(input.replaceId ? "media.update" : "media.upload");
    if (!isBucketId(input.bucket) || !isValidObjectPath(input.path)) return fail("Invalid upload location.");
    const bucket = input.bucket as BucketId;
    const errors = validateUpload({ bucket, filename: input.originalFilename, mimeType: input.mimeType, size: input.size, width: input.width, height: input.height, durationSeconds: input.durationSeconds }, { canUploadSiteAssets: staff.permissions.has("settings.write") });
    if (errors.length) return fail(errors.join(" "));

    const stored = await getStoredObject(bucket, input.path);
    if (!stored) return fail("Upload not found in storage. Please try again.");
    const storedSize = Number(stored.metadata?.size ?? -1);
    const storedMime = stored.metadata?.mimetype;
    if (storedSize !== input.size || (storedMime && storedMime !== input.mimeType)) {
      await removeStoredObjects(bucket, [input.path]).catch(() => undefined);
      return fail("The uploaded file does not match its declared type or size and was removed.");
    }

    const db = getDb();
    const values = {
      bucket,
      path: input.path,
      originalFilename: input.originalFilename,
      mimeType: input.mimeType,
      kind: kindFromMime(input.mimeType),
      sizeBytes: input.size,
      width: input.width ?? null,
      height: input.height ?? null,
      durationSeconds: input.durationSeconds ?? null,
      isPublic: BUCKETS[bucket].public,
    };

    if (input.replaceId) {
      const existing = await getMedia(input.replaceId);
      if (!existing) return fail("Media not found.");
      if (existing.kind !== values.kind) {
        await removeStoredObjects(bucket, [input.path]).catch(() => undefined);
        return fail(`Replacement must be the same kind of file (${existing.kind}).`);
      }
      const [row] = await db.update(mediaAssets).set(values).where(eq(mediaAssets.id, existing.id)).returning();
      await removeStoredObjects(existing.bucket, [existing.path]).catch((e) => console.error("[media] old object cleanup failed", e));
      await audit(staff, { action: "media.replace", entityType: "media", entityId: existing.id, summary: `Replaced ${existing.filename}` });
      revalidatePublicSite();
      return ok({ media: (await getMedia(row!.id))! }, "File replaced");
    }

    const [row] = await db
      .insert(mediaAssets)
      .values({ ...values, filename: input.originalFilename, altText: input.altText, uploadedBy: staff.id })
      .returning({ id: mediaAssets.id });
    await audit(staff, { action: "media.upload", entityType: "media", entityId: row!.id, summary: `Uploaded ${input.originalFilename}`, metadata: { bucket, size: input.size, mimeType: input.mimeType } });
    return ok({ media: (await getMedia(row!.id))! }, "Uploaded");
  });
}

export async function updateMedia(id: string, _prev: unknown, fd: FormData): Promise<ActionResult<{ id?: string }>> {
  return runAction(async () => {
    assertId(id);
    const staff = await authorize("media.update");
    const input = mediaUpdateSchema.parse(formDataToObject(fd));
    const [row] = await getDb().update(mediaAssets).set(input).where(and(eq(mediaAssets.id, id), isNull(mediaAssets.deletedAt))).returning({ id: mediaAssets.id });
    if (!row) return fail("Media not found.");
    await audit(staff, { action: "media.update", entityType: "media", entityId: id, summary: `Updated ${input.filename}` });
    revalidatePublicSite();
    return ok({ id }, "Media updated");
  });
}

export async function deleteMedia(id: string): Promise<ActionResult> {
  return runAction(async () => {
    assertId(id);
    const staff = await authorize("media.delete");
    const media = await getMedia(id);
    if (!media) return fail("Media not found.");
    const usage = await mediaUsage(id);
    if (usage.length) throw new UserFacingError(`This file is in use (${usage.slice(0, 3).join("; ")}${usage.length > 3 ? "…" : ""}). Remove it from those items first.`);
    await removeStoredObjects(media.bucket, [media.path]);
    await getDb().delete(mediaAssets).where(eq(mediaAssets.id, id));
    await audit(staff, { action: "media.delete", entityType: "media", entityId: id, summary: `Deleted ${media.filename}`, metadata: { bucket: media.bucket, path: media.path } });
    revalidatePublicSite();
    return ok(undefined, "Media deleted");
  });
}

/** Used by the media picker dialog. */
export async function searchMedia(query: MediaQuery): Promise<ActionResult<Awaited<ReturnType<typeof listMedia>>>> {
  return runAction(async () => {
    await authorize("cms.read");
    return ok(await listMedia({ ...query, pageSize: Math.min(query.pageSize ?? 24, 48) }));
  });
}

export async function getMediaDownloadUrl(id: string): Promise<ActionResult<{ url: string }>> {
  return runAction(async () => {
    assertId(id);
    await authorize("cms.read");
    const media = await getMedia(id);
    if (!media) return fail("Media not found.");
    return ok({ url: media.url ?? (await createSignedUrl(media.bucket, media.path)) });
  });
}
