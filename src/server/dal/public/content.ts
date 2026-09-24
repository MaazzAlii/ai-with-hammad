import "server-only";

import { asc, desc, eq, inArray, sql } from "drizzle-orm";
import { cache } from "react";

import { contentItems, contentMetrics, socialPlatforms, type ContentPlatform } from "@/db/schema";
import { parseEmbed, type Embed } from "@/lib/embeds";
import { safeHttpUrl } from "@/lib/url-safety";

import { withPublicDb } from "./db";
import { isPublic } from "./filters";
import { loadPublicMedia, type MediaDTO } from "./media";

export type ContentMetricsDTO = {
  views: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  engagementRate: number | null;
  capturedAt: Date;
};

export type ContentCardDTO = {
  id: string;
  slug: string;
  title: string;
  platform: ContentPlatform;
  url: string;
  description: string;
  publishedDate: string | null;
  category: string;
  isFeatured: boolean;
  isHighPerforming: boolean;
  isCampaign: boolean;
  isCaseStudy: boolean;
  performanceRank: number | null;
  thumbnail: MediaDTO | null;
  /** Derived provider thumbnail (YouTube) when no uploaded thumbnail exists. */
  providerThumbnailUrl: string | null;
  embed: Embed | null;
  metrics: ContentMetricsDTO | null;
  updatedAt: Date;
};

export type ContentGroup = "featured" | "high-performing" | "campaign" | "case-study" | "latest";

export const listPublishedContent = cache(async (opts: { platform?: ContentPlatform; slug?: string } = {}): Promise<ContentCardDTO[]> =>
  withPublicDb([], async (db) => {
    const rows = await db
      .select({
        id: contentItems.id,
        slug: contentItems.slug,
        title: contentItems.title,
        platform: contentItems.platform,
        url: contentItems.url,
        embedUrl: contentItems.embedUrl,
        description: contentItems.description,
        publishedDate: contentItems.publishedDate,
        category: contentItems.category,
        isFeatured: contentItems.isFeatured,
        isHighPerforming: contentItems.isHighPerforming,
        isCampaign: contentItems.isCampaign,
        isCaseStudy: contentItems.isCaseStudy,
        performanceRank: contentItems.performanceRank,
        thumbnailMediaId: contentItems.thumbnailMediaId,
        updatedAt: contentItems.updatedAt,
      })
      .from(contentItems)
      .where(
        isPublic(
          contentItems,
          opts.platform ? eq(contentItems.platform, opts.platform) : undefined,
          opts.slug ? eq(contentItems.slug, opts.slug) : undefined,
        ),
      )
      .orderBy(asc(contentItems.sortOrder), desc(contentItems.publishedDate));
    if (rows.length === 0) return [];
    const ids = rows.map((r) => r.id);
    const [metrics, media] = await Promise.all([
      // latest snapshot per item
      db
        .selectDistinctOn([contentMetrics.contentItemId], {
          contentItemId: contentMetrics.contentItemId,
          views: contentMetrics.views,
          likes: contentMetrics.likes,
          comments: contentMetrics.comments,
          shares: contentMetrics.shares,
          engagementRate: contentMetrics.engagementRate,
          capturedAt: contentMetrics.capturedAt,
        })
        .from(contentMetrics)
        .where(inArray(contentMetrics.contentItemId, ids))
        .orderBy(contentMetrics.contentItemId, desc(contentMetrics.capturedAt)),
      loadPublicMedia(db, rows.map((r) => r.thumbnailMediaId)),
    ]);
    const metricsById = new Map(metrics.map(({ contentItemId, ...m }) => [contentItemId, m]));
    return rows.flatMap(({ thumbnailMediaId, embedUrl, ...r }) => {
      const url = safeHttpUrl(r.url, { httpsOnly: true });
      if (!url) return [];
      const embed = parseEmbed(embedUrl) ?? parseEmbed(url);
      return [
        {
          ...r,
          url,
          thumbnail: thumbnailMediaId ? (media.get(thumbnailMediaId) ?? null) : null,
          providerThumbnailUrl: embed?.thumbnailUrl ?? null,
          embed,
          metrics: metricsById.get(r.id) ?? null,
        },
      ];
    });
  }),
);

export const getPublishedContentItem = cache(async (slug: string) => (await listPublishedContent({ slug }))[0] ?? null);

/** Group content for highlight sections. Items may appear in several groups. */
export function groupContent(items: ContentCardDTO[], group: ContentGroup, limit = 6): ContentCardDTO[] {
  const byRank = (a: ContentCardDTO, b: ContentCardDTO) =>
    (a.performanceRank ?? Number.MAX_SAFE_INTEGER) - (b.performanceRank ?? Number.MAX_SAFE_INTEGER);
  switch (group) {
    case "featured":
      return items.filter((i) => i.isFeatured).slice(0, limit);
    case "high-performing":
      return items.filter((i) => i.isHighPerforming).sort(byRank).slice(0, limit);
    case "campaign":
      return items.filter((i) => i.isCampaign).slice(0, limit);
    case "case-study":
      return items.filter((i) => i.isCaseStudy).slice(0, limit);
    case "latest":
      return [...items]
        .sort((a, b) => (b.publishedDate ?? "").localeCompare(a.publishedDate ?? ""))
        .slice(0, limit);
  }
}

export type PlatformDTO = {
  platform: ContentPlatform;
  handle: string;
  displayName: string;
  profileUrl: string;
  description: string;
  followers: number | null;
  followersUpdatedAt: string | null;
  contentCount: number;
};

export const listActivePlatforms = cache(async (): Promise<PlatformDTO[]> =>
  withPublicDb([], async (db) => {
    const rows = await db
      .select({
        id: socialPlatforms.id,
        platform: socialPlatforms.platform,
        handle: socialPlatforms.handle,
        displayName: socialPlatforms.displayName,
        profileUrl: socialPlatforms.profileUrl,
        description: socialPlatforms.description,
        followers: socialPlatforms.followers,
        followersUpdatedAt: socialPlatforms.followersUpdatedAt,
        contentCount: sql<number>`(select count(*)::int from ${contentItems} ci where ci.social_platform_id = ${socialPlatforms.id} and ci.is_published and ci.deleted_at is null)`,
      })
      .from(socialPlatforms)
      .where(eq(socialPlatforms.isActive, true))
      .orderBy(asc(socialPlatforms.sortOrder));
    return rows.flatMap(({ id: _unused, ...r }) => {
      const url = safeHttpUrl(r.profileUrl, { httpsOnly: true });
      return url ? [{ ...r, profileUrl: url }] : [];
    });
  }),
);

export const PLATFORM_LABELS: Record<ContentPlatform, string> = {
  tiktok: "TikTok",
  youtube: "YouTube",
  instagram: "Instagram",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  x: "X",
  other: "Other",
};
