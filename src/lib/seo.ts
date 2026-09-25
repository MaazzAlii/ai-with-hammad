import type { Metadata } from "next";

import { publicEnv } from "./env";
import { truncate } from "./utils";

export function absoluteUrl(path = "/"): string {
  return new URL(path, publicEnv.siteUrl).toString();
}

export type PageSeo = {
  title: string;
  description: string;
  path: string;
  image?: { url: string; width?: number | null; height?: number | null; alt?: string } | null;
  type?: "website" | "article" | "profile";
  noindex?: boolean;
  publishedTime?: string;
  modifiedTime?: string;
};

/**
 * Per-page metadata: unique title/description, canonical, Open Graph, Twitter.
 * Titles use the root layout's template ("%s · Site name").
 */
export function buildMetadata(seo: PageSeo): Metadata {
  const description = truncate(seo.description.replace(/\s+/g, " ").trim(), 160);
  const url = absoluteUrl(seo.path);
  const images = seo.image
    ? [{ url: seo.image.url, width: seo.image.width ?? undefined, height: seo.image.height ?? undefined, alt: seo.image.alt ?? seo.title }]
    : undefined;
  return {
    title: seo.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: seo.title,
      description,
      url,
      type: seo.type ?? "website",
      ...(images ? { images } : {}),
      ...(seo.publishedTime ? { publishedTime: seo.publishedTime } : {}),
      ...(seo.modifiedTime ? { modifiedTime: seo.modifiedTime } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: seo.title,
      description,
      ...(images ? { images: images.map((i) => i.url) } : {}),
    },
    ...(seo.noindex ? { robots: { index: false, follow: false } } : {}),
  };
}

export const NOINDEX: Metadata = { robots: { index: false, follow: false, nocache: true } };
