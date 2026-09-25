/**
 * JSON-LD builders. Each builder only uses data that is rendered visibly on the
 * page it is used on (Google structured data guidelines).
 */
import { absoluteUrl } from "./seo";

type Json = Record<string, unknown>;

export function organizationLd(o: { name: string; description: string; logoUrl?: string | null; sameAs: string[]; email?: string }): Json {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": absoluteUrl("/#organization"),
    name: o.name,
    url: absoluteUrl("/"),
    description: o.description || undefined,
    ...(o.logoUrl ? { logo: o.logoUrl } : {}),
    ...(o.sameAs.length ? { sameAs: o.sameAs } : {}),
    ...(o.email ? { email: o.email } : {}),
  };
}

export function websiteLd(name: string): Json {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": absoluteUrl("/#website"),
    name,
    url: absoluteUrl("/"),
    publisher: { "@id": absoluteUrl("/#organization") },
  };
}

export function breadcrumbLd(items: { name: string; path: string }[]): Json {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: absoluteUrl(it.path) })),
  };
}

export function serviceLd(s: { name: string; description: string; path: string }): Json {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: s.name,
    description: s.description,
    url: absoluteUrl(s.path),
    provider: { "@id": absoluteUrl("/#organization") },
  };
}

export function personLd(p: { name: string; jobTitle: string; description: string; path: string; imageUrl?: string | null; sameAs: string[] }): Json {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: p.name,
    jobTitle: p.jobTitle || undefined,
    description: p.description || undefined,
    url: absoluteUrl(p.path),
    ...(p.imageUrl ? { image: p.imageUrl } : {}),
    ...(p.sameAs.length ? { sameAs: p.sameAs } : {}),
    worksFor: { "@id": absoluteUrl("/#organization") },
  };
}

export function creativeWorkLd(w: {
  name: string;
  description: string;
  path: string;
  imageUrl?: string | null;
  datePublished?: string | null;
  dateModified?: string | null;
  keywords?: string[];
}): Json {
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: w.name,
    description: w.description,
    url: absoluteUrl(w.path),
    ...(w.imageUrl ? { image: w.imageUrl } : {}),
    ...(w.datePublished ? { datePublished: w.datePublished } : {}),
    ...(w.dateModified ? { dateModified: w.dateModified } : {}),
    ...(w.keywords?.length ? { keywords: w.keywords.join(", ") } : {}),
    creator: { "@id": absoluteUrl("/#organization") },
  };
}

export function videoObjectLd(v: {
  name: string;
  description: string;
  thumbnailUrl: string;
  embedUrl?: string;
  contentUrl?: string;
  uploadDate: string;
  durationSeconds?: number | null;
}): Json {
  const iso = v.durationSeconds ? `PT${Math.round(v.durationSeconds)}S` : undefined;
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: v.name,
    description: v.description || v.name,
    thumbnailUrl: v.thumbnailUrl,
    uploadDate: v.uploadDate,
    ...(v.embedUrl ? { embedUrl: v.embedUrl } : {}),
    ...(v.contentUrl ? { contentUrl: v.contentUrl } : {}),
    ...(iso ? { duration: iso } : {}),
  };
}

export function articleLd(a: { headline: string; description: string; path: string; datePublished?: string | null; dateModified?: string | null; imageUrl?: string | null }): Json {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: a.headline.slice(0, 110),
    description: a.description,
    mainEntityOfPage: absoluteUrl(a.path),
    ...(a.imageUrl ? { image: a.imageUrl } : {}),
    ...(a.datePublished ? { datePublished: a.datePublished } : {}),
    ...(a.dateModified ? { dateModified: a.dateModified } : {}),
    author: { "@id": absoluteUrl("/#organization") },
    publisher: { "@id": absoluteUrl("/#organization") },
  };
}

/** Serialize for a <script type="application/ld+json"> tag without allowing tag breakout. */
export function serializeJsonLd(data: Json | Json[]): string {
  return JSON.stringify(data, (_k, v) => (v === undefined ? undefined : v))
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
