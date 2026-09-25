import "server-only";

import { and, asc, desc, eq, inArray, ne, sql } from "drizzle-orm";
import { cache } from "react";

import {
  projectFeatures,
  projectMedia,
  projectMetrics,
  projectServices,
  projectTags,
  projectTeamMembers,
  projects,
  services,
  teamMembers,
} from "@/db/schema";
import { parseVideoEmbed, type Embed } from "@/lib/embeds";
import { safeHttpUrl } from "@/lib/url-safety";

import { withPublicDb } from "./db";
import { isPublic } from "./filters";
import { loadPublicMedia, type MediaDTO } from "./media";

export type Tag = { label: string; slug: string; kind: "technology" | "topic" };

export type ProjectCardDTO = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: string;
  isFeatured: boolean;
  isPinned: boolean;
  cover: MediaDTO | null;
  tags: Tag[];
  updatedAt: Date;
};

export type ProjectMediaItem =
  | { kind: "image"; type: "image" | "screenshot" | "diagram"; media: MediaDTO; title: string; caption: string; alt: string }
  | { kind: "video"; media: MediaDTO; poster: MediaDTO | null; title: string; caption: string }
  | { kind: "embed"; embed: Embed; poster: MediaDTO | null; title: string; caption: string }
  | { kind: "link"; url: string; title: string; caption: string }
  | { kind: "document"; media: MediaDTO; title: string; caption: string };

export type ProjectDetailDTO = ProjectCardDTO & {
  subtitle: string;
  clientName: string;
  industry: string;
  projectYear: number | null;
  projectUrl: string | null;
  repositoryUrl: string | null;
  overview: string;
  problem: string;
  approach: string;
  architecture: string;
  implementation: string;
  results: string;
  seoTitle: string | null;
  seoDescription: string | null;
  publishedAt: Date | null;
  media: ProjectMediaItem[];
  metrics: { label: string; value: string; description: string }[];
  features: { title: string; description: string }[];
  team: { slug: string; name: string; roleTitle: string; roleOnProject: string; photo: MediaDTO | null }[];
  services: { slug: string; title: string }[];
};

const cardCols = {
  id: projects.id,
  slug: projects.slug,
  title: projects.title,
  summary: projects.summary,
  category: projects.category,
  isFeatured: projects.isFeatured,
  isPinned: projects.isPinned,
  coverMediaId: projects.coverMediaId,
  updatedAt: projects.updatedAt,
};

type CardRow = { [K in keyof typeof cardCols]: unknown } & { id: string; coverMediaId: string | null };

async function hydrateCards(db: Parameters<Parameters<typeof withPublicDb>[1]>[0], rows: (CardRow & Omit<ProjectCardDTO, "cover" | "tags">)[]) {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const [tags, media] = await Promise.all([
    db
      .select({ projectId: projectTags.projectId, label: projectTags.label, slug: projectTags.slug, kind: projectTags.kind })
      .from(projectTags)
      .where(inArray(projectTags.projectId, ids))
      .orderBy(asc(projectTags.sortOrder), asc(projectTags.label)),
    loadPublicMedia(db, rows.map((r) => r.coverMediaId)),
  ]);
  return rows.map(({ coverMediaId, ...r }) => ({
    ...r,
    cover: coverMediaId ? (media.get(coverMediaId) ?? null) : null,
    tags: tags.filter((t) => t.projectId === r.id).map(({ label, slug, kind }) => ({ label, slug, kind })),
  }));
}

export type ProjectFilters = { category?: string; tech?: string; limit?: number; pinnedOnly?: boolean; featuredOnly?: boolean };

export const listPublishedProjects = cache(async (filters: ProjectFilters = {}): Promise<ProjectCardDTO[]> =>
  withPublicDb([], async (db) => {
    const conditions = [
      filters.category ? eq(projects.category, filters.category) : undefined,
      filters.pinnedOnly ? eq(projects.isPinned, true) : undefined,
      filters.featuredOnly ? eq(projects.isFeatured, true) : undefined,
      filters.tech
        ? inArray(
            projects.id,
            db.select({ id: projectTags.projectId }).from(projectTags).where(and(eq(projectTags.slug, filters.tech), eq(projectTags.kind, "technology"))),
          )
        : undefined,
    ];
    const q = db
      .select(cardCols)
      .from(projects)
      .where(isPublic(projects, ...conditions))
      .orderBy(desc(projects.isPinned), asc(projects.sortOrder), desc(projects.publishedAt));
    const rows = filters.limit ? await q.limit(filters.limit) : await q;
    return hydrateCards(db, rows as never);
  }),
);

/** Homepage "selected work": pinned projects first, then featured, up to `limit`. */
export const listHomepageProjects = cache(async (limit = 6): Promise<ProjectCardDTO[]> => {
  const pinned = await listPublishedProjects({ pinnedOnly: true, limit });
  if (pinned.length >= limit) return pinned;
  const featured = await listPublishedProjects({ featuredOnly: true, limit });
  const seen = new Set(pinned.map((p) => p.id));
  return [...pinned, ...featured.filter((p) => !seen.has(p.id))].slice(0, limit);
});

export const getProjectFacets = cache(async () =>
  withPublicDb({ categories: [] as string[], technologies: [] as { label: string; slug: string }[] }, async (db) => {
    const [cats, techs] = await Promise.all([
      db
        .selectDistinct({ category: projects.category })
        .from(projects)
        .where(isPublic(projects, ne(projects.category, "")))
        .orderBy(asc(projects.category)),
      db
        .select({ slug: projectTags.slug, label: sql<string>`min(${projectTags.label})` })
        .from(projectTags)
        .innerJoin(projects, eq(projects.id, projectTags.projectId))
        .where(and(eq(projectTags.kind, "technology"), isPublic(projects)))
        .groupBy(projectTags.slug)
        .orderBy(asc(projectTags.slug)),
    ]);
    return { categories: cats.map((c) => c.category), technologies: techs };
  }),
);

export const getPublishedProject = cache(async (slug: string): Promise<ProjectDetailDTO | null> =>
  withPublicDb(null, async (db) => {
    const [row] = await db
      .select({
        ...cardCols,
        subtitle: projects.subtitle,
        clientName: projects.clientName,
        industry: projects.industry,
        projectYear: projects.projectYear,
        projectUrl: projects.projectUrl,
        repositoryUrl: projects.repositoryUrl,
        overview: projects.overview,
        problem: projects.problem,
        approach: projects.approach,
        architecture: projects.architecture,
        implementation: projects.implementation,
        results: projects.results,
        seoTitle: projects.seoTitle,
        seoDescription: projects.seoDescription,
        publishedAt: projects.publishedAt,
      })
      .from(projects)
      .where(isPublic(projects, eq(projects.slug, slug)))
      .limit(1);
    if (!row) return null;

    const [card] = await hydrateCards(db, [row as never]);
    const [mediaRows, metrics, features, team, svc] = await Promise.all([
      db.select().from(projectMedia).where(eq(projectMedia.projectId, row.id)).orderBy(asc(projectMedia.sortOrder)),
      db
        .select({ label: projectMetrics.label, value: projectMetrics.value, description: projectMetrics.description })
        .from(projectMetrics)
        .where(eq(projectMetrics.projectId, row.id))
        .orderBy(asc(projectMetrics.sortOrder)),
      db
        .select({ title: projectFeatures.title, description: projectFeatures.description })
        .from(projectFeatures)
        .where(eq(projectFeatures.projectId, row.id))
        .orderBy(asc(projectFeatures.sortOrder)),
      db
        .select({
          slug: teamMembers.slug,
          name: teamMembers.name,
          roleTitle: teamMembers.roleTitle,
          roleOnProject: projectTeamMembers.roleOnProject,
          photoMediaId: teamMembers.photoMediaId,
        })
        .from(projectTeamMembers)
        .innerJoin(teamMembers, eq(teamMembers.id, projectTeamMembers.teamMemberId))
        .where(and(eq(projectTeamMembers.projectId, row.id), isPublic(teamMembers)))
        .orderBy(asc(projectTeamMembers.sortOrder)),
      db
        .select({ slug: services.slug, title: services.title })
        .from(projectServices)
        .innerJoin(services, eq(services.id, projectServices.serviceId))
        .where(and(eq(projectServices.projectId, row.id), isPublic(services)))
        .orderBy(asc(services.sortOrder)),
    ]);

    const media = await loadPublicMedia(db, [
      ...mediaRows.flatMap((m) => [m.mediaAssetId, m.posterMediaId]),
      ...team.map((t) => t.photoMediaId),
    ]);

    const items: ProjectMediaItem[] = [];
    for (const m of mediaRows) {
      const asset = m.mediaAssetId ? media.get(m.mediaAssetId) : undefined;
      const poster = m.posterMediaId ? (media.get(m.posterMediaId) ?? null) : null;
      const base = { title: m.title, caption: m.caption };
      if ((m.type === "image" || m.type === "screenshot" || m.type === "diagram") && asset) {
        items.push({ kind: "image", type: m.type, media: asset, alt: m.altText || asset.alt, ...base });
      } else if (m.type === "video_upload" && asset) {
        items.push({ kind: "video", media: asset, poster, ...base });
      } else if (m.type === "document" && asset) {
        items.push({ kind: "document", media: asset, ...base });
      } else if (m.type === "youtube" || m.type === "vimeo") {
        const embed = parseVideoEmbed(m.externalUrl);
        if (embed) items.push({ kind: "embed", embed, poster, ...base });
      } else if (m.type === "external") {
        const url = safeHttpUrl(m.externalUrl, { httpsOnly: true });
        if (url) items.push({ kind: "link", url, ...base });
      }
    }

    return {
      ...card!,
      subtitle: row.subtitle,
      clientName: row.clientName,
      industry: row.industry,
      projectYear: row.projectYear,
      projectUrl: safeHttpUrl(row.projectUrl),
      repositoryUrl: safeHttpUrl(row.repositoryUrl),
      overview: row.overview,
      problem: row.problem,
      approach: row.approach,
      architecture: row.architecture,
      implementation: row.implementation,
      results: row.results,
      seoTitle: row.seoTitle,
      seoDescription: row.seoDescription,
      publishedAt: row.publishedAt,
      media: items,
      metrics,
      features,
      team: team.map(({ photoMediaId, ...t }) => ({ ...t, photo: photoMediaId ? (media.get(photoMediaId) ?? null) : null })),
      services: svc,
    };
  }),
);

/** Related projects: share a technology tag or category; excludes the current project. */
export const listRelatedProjects = cache(async (project: ProjectCardDTO, limit = 3): Promise<ProjectCardDTO[]> => {
  const all = await listPublishedProjects();
  const techs = new Set(project.tags.filter((t) => t.kind === "technology").map((t) => t.slug));
  return all
    .filter((p) => p.id !== project.id)
    .map((p) => ({
      p,
      score: (p.category && p.category === project.category ? 2 : 0) + p.tags.filter((t) => techs.has(t.slug)).length,
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.p);
});

export const listProjectsForTeamMember = cache(async (teamMemberId: string): Promise<ProjectCardDTO[]> =>
  withPublicDb([], async (db) => {
    const rows = await db
      .select(cardCols)
      .from(projectTeamMembers)
      .innerJoin(projects, eq(projects.id, projectTeamMembers.projectId))
      .where(and(eq(projectTeamMembers.teamMemberId, teamMemberId), isPublic(projects)))
      .orderBy(asc(projects.sortOrder));
    return hydrateCards(db, rows as never);
  }),
);

export const listProjectsForService = cache(async (serviceId: string): Promise<ProjectCardDTO[]> =>
  withPublicDb([], async (db) => {
    const rows = await db
      .select(cardCols)
      .from(projectServices)
      .innerJoin(projects, eq(projects.id, projectServices.projectId))
      .where(and(eq(projectServices.serviceId, serviceId), isPublic(projects)))
      .orderBy(asc(projects.sortOrder))
      .limit(6);
    return hydrateCards(db, rows as never);
  }),
);
