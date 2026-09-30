import "server-only";

import { asc, eq, inArray } from "drizzle-orm";
import { cache } from "react";

import { teamAppearances, teamMembers, teamSocialLinks } from "@/db/schema";
import { safeHttpUrl } from "@/lib/url-safety";

import { withPublicDb } from "./db";
import { isPublic } from "./filters";
import { loadPublicMedia, type MediaDTO } from "./media";

export type SocialLink = { platform: string; url: string; label: string };
export type Appearance = { title: string; url: string | null; venue: string; appearedOn: string | null };

export type TeamMemberDTO = {
  id: string;
  slug: string;
  name: string;
  roleTitle: string;
  bio: string;
  longBio: string;
  philosophy: string;
  funFact: string;
  skills: string[];
  languages: string[];
  certifications: string[];
  location: string;
  timezone: string;
  email: string | null;
  memberType: "team" | "advisor";
  websiteUrl: string | null;
  isFeatured: boolean;
  photo: MediaDTO | null;
  links: SocialLink[];
  appearances: Appearance[];
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
        philosophy: teamMembers.philosophy,
        funFact: teamMembers.funFact,
        skills: teamMembers.skills,
        languages: teamMembers.languages,
        certifications: teamMembers.certifications,
        location: teamMembers.location,
        timezone: teamMembers.timezone,
        email: teamMembers.email,
        memberType: teamMembers.memberType,
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
    const [links, appearances, media] = await Promise.all([
      db
        .select({ memberId: teamSocialLinks.teamMemberId, platform: teamSocialLinks.platform, url: teamSocialLinks.url, label: teamSocialLinks.label })
        .from(teamSocialLinks)
        .where(inArray(teamSocialLinks.teamMemberId, rows.map((r) => r.id)))
        .orderBy(asc(teamSocialLinks.sortOrder)),
      db
        .select({ memberId: teamAppearances.teamMemberId, title: teamAppearances.title, url: teamAppearances.url, venue: teamAppearances.venue, appearedOn: teamAppearances.appearedOn })
        .from(teamAppearances)
        .where(inArray(teamAppearances.teamMemberId, rows.map((r) => r.id)))
        .orderBy(asc(teamAppearances.sortOrder)),
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
      appearances: appearances
        .filter((a) => a.memberId === r.id)
        .map((a) => ({ title: a.title, url: safeHttpUrl(a.url), venue: a.venue, appearedOn: a.appearedOn })),
    }));
  }),
);

export const getPublishedTeamMember = cache(async (slug: string) => (await listPublishedTeam({ slug }))[0] ?? null);

/** Culture photos configured in Settings → Team page, resolved to media. */
export const getTeamCulturePhotos = cache(async (mediaIds: string[]): Promise<MediaDTO[]> =>
  withPublicDb([], async (db) => {
    if (!mediaIds.length) return [];
    const media = await loadPublicMedia(db, mediaIds);
    return mediaIds.flatMap((id) => (media.has(id) ? [media.get(id)!] : []));
  }),
);
