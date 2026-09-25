import "server-only";

import { and, asc, count, desc, eq, ilike, inArray, isNull, or, sql, type SQL } from "drizzle-orm";

import { getDb } from "@/db";
import {
  contentItems,
  mediaAssets,
  projectMedia,
  projects,
  services,
  siteSettings,
  sponsorshipPartners,
  teamMembers,
} from "@/db/schema";
import { publicObjectUrl } from "@/lib/media/url";

export type AdminMedia = {
  id: string;
  bucket: string;
  path: string;
  filename: string;
  originalFilename: string;
  mimeType: string;
  kind: "image" | "video" | "document" | "other";
  sizeBytes: number;
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
  altText: string;
  caption: string;
  isPublic: boolean;
  createdAt: Date;
  url: string | null;
};

export type MediaQuery = { q?: string; kind?: string; bucket?: string; sort?: "newest" | "oldest" | "name" | "size"; page?: number; pageSize?: number };

export async function listMedia(query: MediaQuery = {}) {
  const db = getDb();
  const pageSize = Math.min(query.pageSize ?? 48, 100);
  const page = Math.max(1, query.page ?? 1);
  const conds: (SQL | undefined)[] = [isNull(mediaAssets.deletedAt)];
  if (query.q) {
    const like = `%${query.q.replace(/[%_\\]/g, (m) => `\\${m}`)}%`;
    conds.push(or(ilike(mediaAssets.filename, like), ilike(mediaAssets.altText, like), ilike(mediaAssets.originalFilename, like)));
  }
  if (query.kind && ["image", "video", "document", "other"].includes(query.kind)) conds.push(eq(mediaAssets.kind, query.kind as "image"));
  if (query.bucket) conds.push(eq(mediaAssets.bucket, query.bucket));
  const order =
    query.sort === "oldest" ? asc(mediaAssets.createdAt) : query.sort === "name" ? asc(mediaAssets.filename) : query.sort === "size" ? desc(mediaAssets.sizeBytes) : desc(mediaAssets.createdAt);
  const where = and(...conds);
  const [rows, [{ total }]] = await Promise.all([
    db.select().from(mediaAssets).where(where).orderBy(order).limit(pageSize).offset((page - 1) * pageSize),
    db.select({ total: count() }).from(mediaAssets).where(where),
  ]);
  return { items: rows.map(toAdminMedia), total, page, pageSize };
}

export function toAdminMedia(r: typeof mediaAssets.$inferSelect): AdminMedia {
  return {
    id: r.id,
    bucket: r.bucket,
    path: r.path,
    filename: r.filename,
    originalFilename: r.originalFilename,
    mimeType: r.mimeType,
    kind: r.kind,
    sizeBytes: r.sizeBytes,
    width: r.width,
    height: r.height,
    durationSeconds: r.durationSeconds,
    altText: r.altText,
    caption: r.caption,
    isPublic: r.isPublic,
    createdAt: r.createdAt,
    url: publicObjectUrl(r.bucket, r.path, r.isPublic && r.bucket !== "private-documents"),
  };
}

export async function getMedia(id: string) {
  const [row] = await getDb().select().from(mediaAssets).where(and(eq(mediaAssets.id, id), isNull(mediaAssets.deletedAt)));
  return row ? toAdminMedia(row) : null;
}

export async function getMediaMany(ids: (string | null | undefined)[]) {
  const unique = [...new Set(ids.filter((v): v is string => Boolean(v)))];
  if (!unique.length) return new Map<string, AdminMedia>();
  const rows = await getDb().select().from(mediaAssets).where(inArray(mediaAssets.id, unique));
  return new Map(rows.map((r) => [r.id, toAdminMedia(r)]));
}

/** Where is this asset used? (prevents deleting media that pages depend on) */
export async function mediaUsage(id: string): Promise<string[]> {
  const db = getDb();
  const [p, pm, s, t, c, sp, st] = await Promise.all([
    db.select({ t: projects.title }).from(projects).where(and(eq(projects.coverMediaId, id), isNull(projects.deletedAt))),
    db
      .select({ t: projects.title })
      .from(projectMedia)
      .innerJoin(projects, eq(projects.id, projectMedia.projectId))
      .where(or(eq(projectMedia.mediaAssetId, id), eq(projectMedia.posterMediaId, id))),
    db.select({ t: services.title }).from(services).where(and(eq(services.coverMediaId, id), isNull(services.deletedAt))),
    db.select({ t: teamMembers.name }).from(teamMembers).where(and(eq(teamMembers.photoMediaId, id), isNull(teamMembers.deletedAt))),
    db.select({ t: contentItems.title }).from(contentItems).where(and(eq(contentItems.thumbnailMediaId, id), isNull(contentItems.deletedAt))),
    db.select({ t: sponsorshipPartners.name }).from(sponsorshipPartners).where(and(eq(sponsorshipPartners.logoMediaId, id), isNull(sponsorshipPartners.deletedAt))),
    db.select({ k: siteSettings.key }).from(siteSettings).where(sql`${siteSettings.value}::text like ${`%${id}%`}`),
  ]);
  return [
    ...p.map((r) => `Project cover: ${r.t}`),
    ...pm.map((r) => `Project media: ${r.t}`),
    ...s.map((r) => `Service: ${r.t}`),
    ...t.map((r) => `Team member: ${r.t}`),
    ...c.map((r) => `Content: ${r.t}`),
    ...sp.map((r) => `Partner: ${r.t}`),
    ...st.map((r) => `Settings: ${r.k}`),
  ];
}

export async function mediaStats() {
  const db = getDb();
  const rows = await db
    .select({ kind: mediaAssets.kind, n: count(), bytes: sql<number>`coalesce(sum(${mediaAssets.sizeBytes}), 0)::bigint` })
    .from(mediaAssets)
    .where(isNull(mediaAssets.deletedAt))
    .groupBy(mediaAssets.kind);
  return rows.map((r) => ({ kind: r.kind, count: r.n, bytes: Number(r.bytes) }));
}
