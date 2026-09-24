import "server-only";

import { asc, desc } from "drizzle-orm";
import { cache } from "react";

// NOTE: this module must NEVER import sponsorshipPackageRates (internal pricing).
import { sponsorshipPackages, sponsorshipPartners, type ContentPlatform } from "@/db/schema";
import { safeHttpUrl } from "@/lib/url-safety";

import { withPublicDb } from "./db";
import { isPublic } from "./filters";
import { loadPublicMedia, type MediaDTO } from "./media";

export type PackageDTO = { id: string; slug: string; name: string; summary: string; deliverables: string[]; platforms: ContentPlatform[] };
export type PartnerDTO = {
  name: string;
  slug: string;
  websiteUrl: string | null;
  description: string;
  campaignSummary: string;
  partneredOn: string | null;
  logo: MediaDTO | null;
};

export const listPublishedPackages = cache(async (): Promise<PackageDTO[]> =>
  withPublicDb([], (db) =>
    db
      .select({
        id: sponsorshipPackages.id,
        slug: sponsorshipPackages.slug,
        name: sponsorshipPackages.name,
        summary: sponsorshipPackages.summary,
        deliverables: sponsorshipPackages.deliverables,
        platforms: sponsorshipPackages.platforms,
      })
      .from(sponsorshipPackages)
      .where(isPublic(sponsorshipPackages))
      .orderBy(asc(sponsorshipPackages.sortOrder)),
  ),
);

export const listPublishedPartners = cache(async (): Promise<PartnerDTO[]> =>
  withPublicDb([], async (db) => {
    const rows = await db
      .select({
        name: sponsorshipPartners.name,
        slug: sponsorshipPartners.slug,
        websiteUrl: sponsorshipPartners.websiteUrl,
        description: sponsorshipPartners.description,
        campaignSummary: sponsorshipPartners.campaignSummary,
        partneredOn: sponsorshipPartners.partneredOn,
        logoMediaId: sponsorshipPartners.logoMediaId,
      })
      .from(sponsorshipPartners)
      .where(isPublic(sponsorshipPartners))
      .orderBy(asc(sponsorshipPartners.sortOrder), desc(sponsorshipPartners.partneredOn));
    const media = await loadPublicMedia(db, rows.map((r) => r.logoMediaId));
    return rows.map(({ logoMediaId, ...r }) => ({
      ...r,
      websiteUrl: safeHttpUrl(r.websiteUrl),
      logo: logoMediaId ? (media.get(logoMediaId) ?? null) : null,
    }));
  }),
);
