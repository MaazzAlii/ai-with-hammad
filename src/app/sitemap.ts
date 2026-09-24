import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/seo";
import { listPublishedContent } from "@/server/dal/public/content";
import { listPublishedProjects } from "@/server/dal/public/projects";
import { listPublishedServices } from "@/server/dal/public/services";
import { listPublishedTeam } from "@/server/dal/public/team";

export const revalidate = 3600;

/** Only canonical, published, indexable URLs. Filtered views, admin and drafts are excluded. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [services, projects, team, content] = await Promise.all([
    listPublishedServices(),
    listPublishedProjects(),
    listPublishedTeam(),
    listPublishedContent(),
  ]);
  const staticRoutes: { path: string; priority: number; changeFrequency: "weekly" | "monthly" | "yearly" }[] = [
    { path: "/", priority: 1, changeFrequency: "weekly" },
    { path: "/services", priority: 0.9, changeFrequency: "monthly" },
    { path: "/projects", priority: 0.9, changeFrequency: "weekly" },
    { path: "/team", priority: 0.6, changeFrequency: "monthly" },
    { path: "/content", priority: 0.7, changeFrequency: "weekly" },
    { path: "/sponsorship", priority: 0.6, changeFrequency: "monthly" },
    { path: "/media-kit", priority: 0.5, changeFrequency: "monthly" },
    { path: "/about", priority: 0.6, changeFrequency: "monthly" },
    { path: "/contact", priority: 0.7, changeFrequency: "yearly" },
    { path: "/privacy-policy", priority: 0.2, changeFrequency: "yearly" },
    { path: "/terms", priority: 0.2, changeFrequency: "yearly" },
    { path: "/cookie-policy", priority: 0.2, changeFrequency: "yearly" },
  ];
  return [
    ...staticRoutes.map((r) => ({ url: absoluteUrl(r.path), changeFrequency: r.changeFrequency, priority: r.priority })),
    ...services.map((s) => ({ url: absoluteUrl(`/services/${s.slug}`), lastModified: s.updatedAt, priority: 0.8 })),
    ...projects.map((p) => ({ url: absoluteUrl(`/projects/${p.slug}`), lastModified: p.updatedAt, priority: 0.8, ...(p.cover ? { images: [p.cover.url] } : {}) })),
    ...team.map((m) => ({ url: absoluteUrl(`/team/${m.slug}`), lastModified: m.updatedAt, priority: 0.5 })),
    ...content.map((c) => ({ url: absoluteUrl(`/content/${c.slug}`), lastModified: c.updatedAt, priority: 0.5 })),
  ];
}
