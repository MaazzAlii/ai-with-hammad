import "server-only";

import { and, asc, desc, eq, isNotNull, isNull } from "drizzle-orm";
import { cache } from "react";

// NOTE: this module must NEVER import sponsorshipPackageRates (internal pricing).
import { sponsorshipPackages, sponsorshipPartners, testimonials, type ContentPlatform } from "@/db/schema";
import { safeHttpUrl } from "@/lib/url-safety";

import { withPublicDb } from "./db";
import { isPublic } from "./filters";
import { loadPublicMedia, type MediaDTO } from "./media";

export type PackageDTO = { id: string; slug: string; name: string; summary: string; deliverables: string[]; platforms: ContentPlatform[]; exclusivityNotes: string };
export type PartnerDTO = {
  name: string;
  slug: string;
  websiteUrl: string | null;
  description: string;
  campaignSummary: string;
  resultHeadline: string;
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
        exclusivityNotes: sponsorshipPackages.exclusivityNotes,
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
        resultHeadline: sponsorshipPartners.resultHeadline,
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

export const getMediaKitFile = cache(async (mediaId: string | null): Promise<MediaDTO | null> => {
  if (!mediaId) return null;
  return withPublicDb(null, async (db) => (await loadPublicMedia(db, [mediaId])).get(mediaId) ?? null);
});

export type SponsorTestimonialDTO = { id: string; authorName: string; authorTitle: string; company: string; quote: string; rating: number; photo: MediaDTO | null };

export const listSponsorshipTestimonials = cache(async (): Promise<SponsorTestimonialDTO[]> =>
  withPublicDb([], async (db) => {
    const rows = await db
      .select({
        id: testimonials.id,
        authorName: testimonials.authorName,
        authorTitle: testimonials.authorTitle,
        company: testimonials.company,
        quote: testimonials.quote,
        rating: testimonials.rating,
        photoMediaId: testimonials.photoMediaId,
      })
      .from(testimonials)
      .where(
        and(
          isNotNull(testimonials.sponsorshipPartnerId),
          eq(testimonials.isPublished, true),
          eq(testimonials.status, "approved"),
          eq(testimonials.consentToPublish, true),
          isNull(testimonials.deletedAt),
        ),
      )
      .orderBy(desc(testimonials.isFeatured), asc(testimonials.sortOrder));
    const media = await loadPublicMedia(db, rows.map((r) => r.photoMediaId));
    return rows.map(({ photoMediaId, ...r }) => ({ ...r, photo: photoMediaId ? (media.get(photoMediaId) ?? null) : null }));
  }),
);
