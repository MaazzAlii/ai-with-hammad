import "server-only";

import { and, asc, eq, inArray, not, like } from "drizzle-orm";
import { cache } from "react";

import { legalDocuments, navigationItems, siteSettings } from "@/db/schema";
import { parseSettings, type Settings, type SettingsKey } from "@/lib/settings";
import { safeHref } from "@/lib/url-safety";

import { withPublicDb } from "./db";
import { loadPublicMedia, type MediaDTO } from "./media";

const PUBLIC_KEYS: SettingsKey[] = ["general", "home", "about", "team", "content", "seo", "social", "sponsorship", "contact", "assistant"];

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

export const getSiteMedia = cache(async (): Promise<{ logo: MediaDTO | null; logoDark: MediaDTO | null; ogImage: MediaDTO | null; heroImage: MediaDTO | null }> => {
  const s = await getPublicSettings();
  const map = await withPublicDb(new Map<string, MediaDTO>(), (db) =>
    loadPublicMedia(db, [s.general.logoMediaId, s.general.logoDarkMediaId, s.seo.ogImageMediaId, s.home.heroMediaId]),
  );
  return {
    logo: s.general.logoMediaId ? (map.get(s.general.logoMediaId) ?? null) : null,
    logoDark: s.general.logoDarkMediaId ? (map.get(s.general.logoDarkMediaId) ?? null) : null,
    ogImage: s.seo.ogImageMediaId ? (map.get(s.seo.ogImageMediaId) ?? null) : null,
    heroImage: s.home.heroMediaId ? (map.get(s.home.heroMediaId) ?? null) : null,
  };
});

export type NavLink = { label: string; href: string; external: boolean };

const DEFAULT_NAV: Record<"header" | "footer" | "legal", NavLink[]> = {
  header: [
    { label: "Services", href: "/services", external: false },
    { label: "Our work", href: "/projects", external: false },
    { label: "Tutorials", href: "/content", external: false },
    { label: "For brands", href: "/sponsorship", external: false },
    { label: "Team", href: "/team", external: false },
    { label: "About", href: "/about", external: false },
    { label: "All links", href: "/links", external: false },
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
    { label: "Sitemap", href: "/sitemap", external: false },
  ],
};

const LINKS_TAB: NavLink = { label: "All links", href: "/links", external: false };

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
  if (!out.legal.length) out.legal = [...DEFAULT_NAV.legal];
  else if (!out.legal.some((l) => l.href === "/sitemap")) out.legal.push({ label: "Sitemap", href: "/sitemap", external: false });
  return out;
});

export type LegalDoc = { slug: string; title: string; body: string; effectiveOn: string | null; updatedAt: Date };

const DEFAULT_LEGAL_DOCS: Record<string, LegalDoc> = {
  "privacy-policy": {
    slug: "privacy-policy",
    title: "Privacy Policy",
    body: `This policy explains what personal information AI With Hamad ("we", "us") collects through this website, why, and what choices you have.

## Information we collect

- **Information you send us.** When you use the contact, project inquiry, or sponsorship forms, we collect the details you provide: your name, email address, company name, phone number, website, estimated budget, timeline, and message.
- **Technical information.** To protect our forms and services from abuse and automated spam, we record security hashes and standard technical metadata (such as browser user-agent and submission timestamps).
- **Analytics.** We use privacy-friendly, cookieless analytics (Vercel Web Analytics and Speed Insights) to monitor site health, traffic volume, and page loading performance without tracking individual personal identities.

## How we use your information

- To evaluate and respond to your inquiry and discuss potential collaboration.
- To manage client relationships, deliverables, and communications.
- To defend against spam, fraudulent inquiries, and malicious activity.
- To improve our site structure, tutorials, and service offerings.

We do not sell, rent, or trade your personal information to third parties.

## Service providers and infrastructure

We partner with trusted infrastructure providers to host and operate this platform:
- **Hosting & Edge Delivery:** Vercel (frontend deployment and performance telemetry)
- **Database & Storage:** Supabase (PostgreSQL database and secure file storage)
- **Transactional Communications:** Resend (email delivery for inquiries)

All service providers process data strictly on our behalf under data protection agreements.

## Data retention

We retain inquiry details and communication history only as long as necessary to fulfill the purpose of the inquiry or maintain an active business relationship. Inactive inquiries are periodically reviewed and removed.

## Your rights

You have the right to request access to, correction of, or deletion of any personal data you have submitted to us. To exercise any of these rights, please reach out via our [contact page](/contact).

## Updates to this policy

We may periodically revise this Privacy Policy to reflect operational or legal updates. The effective date at the top of this page indicates the most recent revision.`,
    effectiveOn: "2026-01-01",
    updatedAt: new Date("2026-01-01"),
  },
  terms: {
    slug: "terms",
    title: "Terms of Service",
    body: `These terms govern your access to and use of the AI With Hamad website and digital resources.

## Use of the website

You agree to use this website only for lawful purposes. You must not:
- Interfere with or disrupt the security, integrity, or availability of the website or its infrastructure.
- Attempt unauthorized access to restricted areas, including admin consoles, client portals, or internal APIs.
- Submit false, deceptive, abusive, or automated spam content through any form.

## Intellectual property

All original content, tutorials, case studies, branding, design assets, and materials published on this website are the property of AI With Hamad or used with appropriate license and permission. Third-party brand names, logos, and trademarks mentioned belong to their respective owners.

You may share links and brief excerpts with attribution, but reproduction of full articles, assets, or software without prior written authorization is prohibited.

## Agency engagements

General information and case studies on this website are informational and do not constitute a binding proposal or contract. Client engagements, deliverables, milestones, and guarantees are exclusively governed by individual written Master Services Agreements (MSA) or Statements of Work (SOW).

## External links and embedded media

This website may contain links to external websites and embedded third-party media (such as YouTube videos, LinkedIn posts, or GitHub repositories). We are not responsible for the privacy practices, content, or availability of third-party platforms.

## Limitation of liability

This website is provided on an "as is" and "as available" basis without warranties of any kind. To the fullest extent permitted by law, AI With Hamad disclaims liability for any direct, indirect, incidental, or consequential damages resulting from your use of or inability to access the site.

## Modifications

We reserve the right to revise these Terms of Service at any time. Continued use of the website following published updates constitutes acceptance of the modified terms.`,
    effectiveOn: "2026-01-01",
    updatedAt: new Date("2026-01-01"),
  },
  "cookie-policy": {
    slug: "cookie-policy",
    title: "Cookie Policy",
    body: `This Cookie Policy explains how AI With Hamad uses cookies and related browser storage technologies on this website.

## What are cookies?

Cookies are small text files placed on your device by websites you visit. They are commonly used to remember preferences, maintain secure login sessions, and support website functionality.

## Cookies and storage we use

### 1. Strictly Necessary Cookies (Staff & Client Portal)
When authorized staff sign in to the CMS or clients sign in to the private client portal, secure authentication session cookies are issued by Supabase Auth. These cookies are essential for verifying identity and protecting sensitive areas. Visitors who do not log in do not receive these cookies.

### 2. Preference Storage (Local Storage)
We use your browser's local storage to remember:
- **Cookie Consent:** Your decision regarding non-essential features (\`aiwh_cookie_consent\`).
- **Color Theme:** Your choice of light or dark theme mode.

These items contain no personally identifiable data and do not track you across other websites.

### 3. Analytics (Cookieless)
Our performance and visitor analytics (powered by Vercel Web Analytics and Speed Insights) are cookieless and privacy-centric. They calculate aggregate metrics without storing cookies or tracking individual visitors across sessions.

## Third-party embedded content

We embed videos and technical demonstrations from providers such as YouTube. To protect your privacy:
- We use a **click-to-load facade**: no third-party scripts, iframes, or cookies are loaded until you explicitly click to play or view the media.
- Where available, YouTube embeds utilize the privacy-enhanced \`youtube-nocookie.com\` domain.
- Once loaded, third-party platforms may place cookies subject to their own policies.

## How to manage cookies

You can manage or clear your cookie preferences directly in your browser settings. You can also accept or restrict non-essential cookies via our on-site cookie banner at any time. Note that disabling strictly necessary cookies will prevent you from signing in to the client portal or administrative panels.`,
    effectiveOn: "2026-01-01",
    updatedAt: new Date("2026-01-01"),
  },
};

export const getLegalDocument = cache(async (slug: string): Promise<LegalDoc | null> => {
  const rows = await withPublicDb([] as LegalDoc[], (db) =>
    db
      .select({ slug: legalDocuments.slug, title: legalDocuments.title, body: legalDocuments.body, effectiveOn: legalDocuments.effectiveOn, updatedAt: legalDocuments.updatedAt })
      .from(legalDocuments)
      .where(and(eq(legalDocuments.slug, slug), eq(legalDocuments.isPublished, true)))
      .limit(1),
  );
  if (rows[0]) return rows[0];
  return DEFAULT_LEGAL_DOCS[slug] ?? null;
});
