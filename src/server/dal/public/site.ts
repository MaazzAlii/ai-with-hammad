import "server-only";

import { and, asc, eq, inArray, not, like } from "drizzle-orm";
import { cache } from "react";

import { legalDocuments, navigationItems, siteSettings } from "@/db/schema";
import { parseSettings, type Settings, type SettingsKey } from "@/lib/settings";
import { safeHref } from "@/lib/url-safety";

import { withPublicDb } from "./db";
import { loadPublicMedia, type MediaDTO } from "./media";

const PUBLIC_KEYS: SettingsKey[] = ["general", "home", "about", "seo", "social", "sponsorship", "contact"];

export type PublicSettings = { [K in SettingsKey]: Settings<K> };

export const getPublicSettings = cache(async (): Promise<PublicSettings> => {
  const rows = await withPublicDb([] as { key: string; value: unknown }[], (db) =>
    db
      .select({ key: siteSettings.key, value: siteSettings.value })
      .from(siteSettings)
      .where(and(inArray(siteSettings.key, PUBLIC_KEYS), not(like(siteSettings.key, "internal.%")))),
  );
  const byKey = new Map(rows.map((r) => [r.key, r.value]));
  return Object.fromEntries(PUBLIC_KEYS.map((k) => [k, parseSettings(k, byKey.get(k))])) as PublicSettings;
});

export const getSiteMedia = cache(async (): Promise<{ logo: MediaDTO | null; ogImage: MediaDTO | null; heroImage: MediaDTO | null }> => {
  const s = await getPublicSettings();
  const map = await withPublicDb(new Map<string, MediaDTO>(), (db) =>
    loadPublicMedia(db, [s.general.logoMediaId, s.seo.ogImageMediaId, s.home.heroMediaId]),
  );
  return {
    logo: s.general.logoMediaId ? (map.get(s.general.logoMediaId) ?? null) : null,
    ogImage: s.seo.ogImageMediaId ? (map.get(s.seo.ogImageMediaId) ?? null) : null,
    heroImage: s.home.heroMediaId ? (map.get(s.home.heroMediaId) ?? null) : null,
  };
});

export type NavLink = { label: string; href: string; external: boolean };

const DEFAULT_NAV: Record<"header" | "footer" | "legal", NavLink[]> = {
  header: [
    { label: "Services", href: "/services", external: false },
    { label: "Projects", href: "/projects", external: false },
    { label: "Team", href: "/team", external: false },
    { label: "Content", href: "/content", external: false },
    { label: "Sponsorship", href: "/sponsorship", external: false },
    { label: "About", href: "/about", external: false },
    { label: "Links", href: "/links", external: false },
  ],
  footer: [
    { label: "Services", href: "/services", external: false },
    { label: "Projects", href: "/projects", external: false },
    { label: "Testimonials", href: "/testimonials", external: false },
    { label: "Media kit", href: "/media-kit", external: false },
    { label: "Contact", href: "/contact", external: false },
  ],
  legal: [
    { label: "Privacy Policy", href: "/privacy-policy", external: false },
    { label: "Terms of Service", href: "/terms", external: false },
    { label: "Cookie Policy", href: "/cookie-policy", external: false },
  ],
};

const LINKS_TAB: NavLink = { label: "Links", href: "/links", external: false };

export const getNavigation = cache(async () => {
  const rows = await withPublicDb(null, (db) =>
    db
      .select({ location: navigationItems.location, label: navigationItems.label, href: navigationItems.href, isExternal: navigationItems.isExternal, isVisible: navigationItems.isVisible })
      .from(navigationItems)
      .orderBy(asc(navigationItems.sortOrder), asc(navigationItems.label)),
  );
  if (!rows) return DEFAULT_NAV;
  const out: Record<"header" | "footer" | "legal", NavLink[]> = { header: [], footer: [], legal: [] };
  for (const r of rows) {
    if (!r.isVisible) continue;
    const href = safeHref(r.href);
    if (href) out[r.location].push({ label: r.label, href, external: r.isExternal || href.startsWith("https://") });
  }
  // The link-in-bio page gets a header tab by default. Once a header item for /links exists
  // (visible or hidden) in Admin → Navigation, that item decides its label, position and visibility.
  if (!rows.some((r) => r.location === "header" && r.href === "/links")) out.header.push(LINKS_TAB);
  return out;
});

export type LegalDoc = { slug: string; title: string; body: string; effectiveOn: string | null; updatedAt: Date };

export const getLegalDocument = cache(async (slug: string): Promise<LegalDoc | null> => {
  const rows = await withPublicDb([] as LegalDoc[], (db) =>
    db
      .select({ slug: legalDocuments.slug, title: legalDocuments.title, body: legalDocuments.body, effectiveOn: legalDocuments.effectiveOn, updatedAt: legalDocuments.updatedAt })
      .from(legalDocuments)
      .where(and(eq(legalDocuments.slug, slug), eq(legalDocuments.isPublished, true)))
      .limit(1),
  );
  return rows[0] ?? null;
});
