import "server-only";

import { asc, eq, inArray } from "drizzle-orm";
import { cache } from "react";

import { teamMembers, teamSocialLinks } from "@/db/schema";
import { safeHttpUrl } from "@/lib/url-safety";

import { withPublicDb } from "./db";
import { isPublic } from "./filters";
import { loadPublicMedia, type MediaDTO } from "./media";

export type SocialLink = { platform: string; url: string; label: string };

export type TeamMemberDTO = {
  id: string;
  slug: string;
  name: string;
  roleTitle: string;
  bio: string;
  longBio: string;
  skills: string[];
  location: string;
  websiteUrl: string | null;
  isFeatured: boolean;
  photo: MediaDTO | null;
  links: SocialLink[];
  updatedAt: Date;
};

export const listPublishedTeam = cache(async (opts: { featuredOnly?: boolean; slug?: string } = {}): Promise<TeamMemberDTO[]> =>
  withPublicDb([], async (db) => {
    const rows = await db
      .select({
        id: teamMembers.id,
        slug: teamMembers.slug,
        name: teamMembers.name,
        roleTitle: teamMembers.roleTitle,
        bio: teamMembers.bio,
        longBio: teamMembers.longBio,
        skills: teamMembers.skills,
        location: teamMembers.location,
        websiteUrl: teamMembers.websiteUrl,
        isFeatured: teamMembers.isFeatured,
        photoMediaId: teamMembers.photoMediaId,
        updatedAt: teamMembers.updatedAt,
      })
      .from(teamMembers)
      .where(
        isPublic(
          teamMembers,
          opts.featuredOnly ? eq(teamMembers.isFeatured, true) : undefined,
          opts.slug ? eq(teamMembers.slug, opts.slug) : undefined,
        ),
      )
      .orderBy(asc(teamMembers.sortOrder), asc(teamMembers.name));
    if (rows.length === 0) return [];
    const [links, media] = await Promise.all([
      db
        .select({ memberId: teamSocialLinks.teamMemberId, platform: teamSocialLinks.platform, url: teamSocialLinks.url, label: teamSocialLinks.label })
        .from(teamSocialLinks)
        .where(inArray(teamSocialLinks.teamMemberId, rows.map((r) => r.id)))
        .orderBy(asc(teamSocialLinks.sortOrder)),
      loadPublicMedia(db, rows.map((r) => r.photoMediaId)),
    ]);
    return rows.map(({ photoMediaId, ...r }) => ({
      ...r,
      websiteUrl: safeHttpUrl(r.websiteUrl),
      photo: photoMediaId ? (media.get(photoMediaId) ?? null) : null,
      links: links
        .filter((l) => l.memberId === r.id)
        .flatMap((l) => {
          const url = safeHttpUrl(l.url);
          return url ? [{ platform: l.platform, url, label: l.label }] : [];
        }),
    }));
  }),
);

export const getPublishedTeamMember = cache(async (slug: string) => (await listPublishedTeam({ slug }))[0] ?? null);
