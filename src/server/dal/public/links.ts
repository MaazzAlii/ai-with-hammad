import "server-only";

import { and, asc, eq, gt, isNull, lte, or, sql } from "drizzle-orm";
import { cache } from "react";

import { bioLinks, type BioLinkKind } from "@/db/schema";
import { safeHttpUrl } from "@/lib/url-safety";

import { withPublicDb } from "./db";
import { listPublishedTeam, type TeamMemberDTO } from "./team";

export type BioLinkDTO = {
  id: string;
  title: string;
  description: string;
  kind: BioLinkKind;
  icon: string;
  isFeatured: boolean;
  teamMemberId: string | null;
  /** Direct destination (validated). The page links through /go/<id> so clicks are counted. */
  url: string;
};

export function safeLinkUrl(url: string): string | null {
  if (/^mailto:[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(url)) return url;
  return safeHttpUrl(url, { httpsOnly: true });
}

/** Postgres "undefined_table": the bio_links migration has not been applied to this database yet. */
export function isMissingTable(e: unknown) {
  const err = e as { code?: string; cause?: { code?: string } };
  return err?.code === "42P01" || err?.cause?.code === "42P01";
}

/**
 * Why a link is not on /links right now (null = it is live). Mirrors the query below and the
 * URL check, so the admin can see exactly what is hiding a link.
 */
export function whyNotLive(
  l: { isPublished: boolean; deletedAt: Date | null; startsAt: Date | null; endsAt: Date | null; url: string },
  now = new Date(),
): string | null {
  if (l.deletedAt) return "deleted";
  if (!l.isPublished) return "hidden (Published is off)";
  if (l.startsAt && l.startsAt > now) return `scheduled — shows from ${l.startsAt.toISOString().slice(0, 16).replace("T", " ")} UTC`;
  if (l.endsAt && l.endsAt <= now) return `expired — hidden after ${l.endsAt.toISOString().slice(0, 16).replace("T", " ")} UTC`;
  if (!safeLinkUrl(l.url)) return "URL is not an https:// or mailto: link";
  return null;
}

/** Published links whose schedule window is open right now, in admin order. */
export const listLiveBioLinks = cache(async (): Promise<BioLinkDTO[]> =>
  withPublicDb([], async (db) => {
    const now = sql`now()`;
    const rows = await db
      .select({
        id: bioLinks.id,
        title: bioLinks.title,
        description: bioLinks.description,
        kind: bioLinks.kind,
        icon: bioLinks.icon,
        isFeatured: bioLinks.isFeatured,
        teamMemberId: bioLinks.teamMemberId,
        url: bioLinks.url,
      })
      .from(bioLinks)
      .where(
        and(
          eq(bioLinks.isPublished, true),
          isNull(bioLinks.deletedAt),
          or(isNull(bioLinks.startsAt), lte(bioLinks.startsAt, now)),
          or(isNull(bioLinks.endsAt), gt(bioLinks.endsAt, now)),
        ),
      )
      .orderBy(asc(bioLinks.sortOrder), asc(bioLinks.createdAt))
      .catch((e: unknown) => {
        // Keep the site (and the build) working until supabase/migrations/20260926_bio_links.sql is run.
        if (isMissingTable(e)) {
          console.warn("[links] bio_links table missing — run supabase/migrations/20260926_bio_links.sql");
          return [];
        }
        console.error("[links] failed to load bio links", e);
        throw e;
      });
    return rows.flatMap((r) => {
      const url = safeLinkUrl(r.url);
      return url ? [{ ...r, url }] : [];
    });
  }),
);

/** Destination for a click-through (null when missing, unpublished or out of schedule). */
export async function resolveBioLink(id: string): Promise<string | null> {
  const link = (await listLiveBioLinks()).find((l) => l.id === id);
  return link?.url ?? null;
}

export type LinkPageData = {
  featured: BioLinkDTO[];
  links: BioLinkDTO[];
  partners: BioLinkDTO[];
  socials: BioLinkDTO[];
  /** One card per person who has at least one live link assigned in Admin → Link in bio. */
  people: { member: TeamMemberDTO; profiles: BioLinkDTO[]; links: BioLinkDTO[] }[];
};

/**
 * Everything /links renders, grouped. A person's card shows only the links the admin assigned to
 * them ("Belongs to"): `social` links as the icon row, everything else as rows. Nothing is pulled in
 * automatically from team profiles, so hiding/unpublishing a link in the admin hides it here.
 */
export const getLinkPage = cache(async (): Promise<LinkPageData> => {
  const [all, team] = await Promise.all([listLiveBioLinks(), listPublishedTeam()]);
  const general = all.filter((l) => !l.teamMemberId);
  return {
    featured: general.filter((l) => l.isFeatured && l.kind !== "social"),
    links: general.filter((l) => !l.isFeatured && l.kind === "link"),
    partners: general.filter((l) => !l.isFeatured && (l.kind === "affiliate" || l.kind === "sponsor")),
    socials: general.filter((l) => l.kind === "social"),
    people: team
      .map((member) => {
        const mine = all.filter((l) => l.teamMemberId === member.id);
        return { member, profiles: mine.filter((l) => l.kind === "social"), links: mine.filter((l) => l.kind !== "social") };
      })
      .filter((p) => p.profiles.length || p.links.length),
  };
});
