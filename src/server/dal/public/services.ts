import "server-only";

import { asc, eq, inArray } from "drizzle-orm";
import { cache } from "react";

import { serviceFeatures, services } from "@/db/schema";

import { withPublicDb } from "./db";
import { isPublic } from "./filters";
import { loadPublicMedia, type MediaDTO } from "./media";

export type ServiceSummary = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  icon: string;
  isFeatured: boolean;
  updatedAt: Date;
};

export type ServiceDetail = ServiceSummary & {
  description: string;
  seoTitle: string | null;
  seoDescription: string | null;
  cover: MediaDTO | null;
  features: { title: string; description: string }[];
};

const summaryCols = {
  id: services.id,
  slug: services.slug,
  title: services.title,
  summary: services.summary,
  icon: services.icon,
  isFeatured: services.isFeatured,
  updatedAt: services.updatedAt,
};

export const listPublishedServices = cache(async (opts: { featuredOnly?: boolean } = {}): Promise<ServiceSummary[]> =>
  withPublicDb([], (db) =>
    db
      .select(summaryCols)
      .from(services)
      .where(isPublic(services, opts.featuredOnly ? eq(services.isFeatured, true) : undefined))
      .orderBy(asc(services.sortOrder), asc(services.title)),
  ),
);

export const getPublishedService = cache(async (slug: string): Promise<ServiceDetail | null> =>
  withPublicDb(null, async (db) => {
    const [row] = await db
      .select({ ...summaryCols, description: services.description, seoTitle: services.seoTitle, seoDescription: services.seoDescription, coverMediaId: services.coverMediaId })
      .from(services)
      .where(isPublic(services, eq(services.slug, slug)))
      .limit(1);
    if (!row) return null;
    const [features, media] = await Promise.all([
      db
        .select({ title: serviceFeatures.title, description: serviceFeatures.description })
        .from(serviceFeatures)
        .where(eq(serviceFeatures.serviceId, row.id))
        .orderBy(asc(serviceFeatures.sortOrder)),
      loadPublicMedia(db, [row.coverMediaId]),
    ]);
    const { coverMediaId, ...rest } = row;
    return { ...rest, features, cover: coverMediaId ? (media.get(coverMediaId) ?? null) : null };
  }),
);

/** Map of serviceId → feature titles for the services index (one query). */
export const getServiceFeatureTitles = cache(async (serviceIds: string[]) =>
  withPublicDb(new Map<string, string[]>(), async (db) => {
    if (serviceIds.length === 0) return new Map<string, string[]>();
    const rows = await db
      .select({ serviceId: serviceFeatures.serviceId, title: serviceFeatures.title })
      .from(serviceFeatures)
      .where(inArray(serviceFeatures.serviceId, serviceIds))
      .orderBy(asc(serviceFeatures.sortOrder));
    const map = new Map<string, string[]>();
    for (const r of rows) map.set(r.serviceId, [...(map.get(r.serviceId) ?? []), r.title]);
    return map;
  }),
);
