import "server-only";

import { and, inArray, isNull } from "drizzle-orm";

import type { Database } from "@/db";
import { mediaAssets } from "@/db/schema";
import { publicObjectUrl } from "@/lib/media/url";

export type MediaDTO = {
  id: string;
  url: string;
  alt: string;
  caption: string;
  width: number | null;
  height: number | null;
  mimeType: string;
  kind: "image" | "video" | "document" | "other";
  durationSeconds: number | null;
};

/** Load public media assets by id → Map. Private or deleted assets are never returned. */
export async function loadPublicMedia(db: Database, ids: (string | null | undefined)[]): Promise<Map<string, MediaDTO>> {
  const unique = [...new Set(ids.filter((v): v is string => Boolean(v)))];
  const map = new Map<string, MediaDTO>();
  if (unique.length === 0) return map;
  const rows = await db
    .select({
      id: mediaAssets.id,
      bucket: mediaAssets.bucket,
      path: mediaAssets.path,
      altText: mediaAssets.altText,
      caption: mediaAssets.caption,
      width: mediaAssets.width,
      height: mediaAssets.height,
      mimeType: mediaAssets.mimeType,
      kind: mediaAssets.kind,
      isPublic: mediaAssets.isPublic,
      durationSeconds: mediaAssets.durationSeconds,
    })
    .from(mediaAssets)
    .where(and(inArray(mediaAssets.id, unique), isNull(mediaAssets.deletedAt)));
  for (const r of rows) {
    if (!r.isPublic || r.bucket === "private-documents") continue;
    const url = publicObjectUrl(r.bucket, r.path);
    if (!url) continue;
    map.set(r.id, {
      id: r.id,
      url,
      alt: r.altText,
      caption: r.caption,
      width: r.width,
      height: r.height,
      mimeType: r.mimeType,
      kind: r.kind,
      durationSeconds: r.durationSeconds,
    });
  }
  return map;
}
