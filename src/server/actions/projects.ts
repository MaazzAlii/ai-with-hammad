"use server";

import { and, eq, isNull } from "drizzle-orm";

import { getDb } from "@/db";
import { projectFeatures, projectMedia, projectMetrics, projectServices, projectTags, projectTeamMembers, projects } from "@/db/schema";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { formDataToObject } from "@/lib/form-data";
import { slugify } from "@/lib/utils";
import { projectSchema } from "@/lib/validation/admin";

import { audit } from "../audit";
import { authorize, type Staff } from "../auth/session";
import { revalidatePublicSite } from "../revalidate";
import { assertId, runAction } from "../run-action";

type Result = ActionResult<{ id?: string; redirectTo?: string }>;

async function save(staff: Staff, id: string | null, fd: FormData): Promise<Result> {
  const input = projectSchema.parse(formDataToObject(fd));
  const canPublish = staff.permissions.has("projects.publish");
  const db = getDb();
  const base = {
    title: input.title,
    slug: input.slug,
    subtitle: input.subtitle,
    summary: input.summary,
    category: input.category,
    clientName: input.clientName,
    industry: input.industry,
    projectYear: input.projectYear,
    projectUrl: input.projectUrl,
    repositoryUrl: input.repositoryUrl,
    coverMediaId: input.coverMediaId,
    overview: input.overview,
    problem: input.problem,
    approach: input.approach,
    architecture: input.architecture,
    implementation: input.implementation,
    results: input.results,
    seoTitle: input.seoTitle,
    seoDescription: input.seoDescription,
  };
  // Editors can save content but publication flags are only changed by users with projects.publish.
  const flags = canPublish ? { isPublished: input.isPublished, isFeatured: input.isFeatured, isPinned: input.isPinned } : {};

  const projectId = await db.transaction(async (tx) => {
    let pid = id;
    if (pid) {
      const [existing] = await tx.select({ publishedAt: projects.publishedAt }).from(projects).where(and(eq(projects.id, pid), isNull(projects.deletedAt)));
      if (!existing) throw new Error("NOT_FOUND");
      await tx
        .update(projects)
        .set({ ...base, ...flags, ...(canPublish && input.isPublished && !existing.publishedAt ? { publishedAt: new Date() } : {}) })
        .where(eq(projects.id, pid));
      await Promise.all([
        tx.delete(projectTags).where(eq(projectTags.projectId, pid)),
        tx.delete(projectMetrics).where(eq(projectMetrics.projectId, pid)),
        tx.delete(projectFeatures).where(eq(projectFeatures.projectId, pid)),
        tx.delete(projectTeamMembers).where(eq(projectTeamMembers.projectId, pid)),
        tx.delete(projectServices).where(eq(projectServices.projectId, pid)),
        tx.delete(projectMedia).where(eq(projectMedia.projectId, pid)),
      ]);
    } else {
      const [row] = await tx
        .insert(projects)
        .values({ ...base, ...flags, ...(canPublish && input.isPublished ? { publishedAt: new Date() } : {}) })
        .returning({ id: projects.id });
      pid = row!.id;
    }
    const tags = [
      ...dedupe(input.technologies).map((label, i) => ({ projectId: pid!, kind: "technology" as const, label, slug: slugify(label), sortOrder: i })),
      ...dedupe(input.topics).map((label, i) => ({ projectId: pid!, kind: "topic" as const, label, slug: slugify(label), sortOrder: i })),
    ].filter((t) => t.slug);
    if (tags.length) await tx.insert(projectTags).values(tags);
    if (input.metrics.length) await tx.insert(projectMetrics).values(input.metrics.map((m, i) => ({ ...m, projectId: pid!, sortOrder: i })));
    if (input.features.length) await tx.insert(projectFeatures).values(input.features.map((f, i) => ({ ...f, projectId: pid!, sortOrder: i })));
    const team = input.team.filter((t, i, arr) => arr.findIndex((x) => x.teamMemberId === t.teamMemberId) === i);
    if (team.length) await tx.insert(projectTeamMembers).values(team.map((t, i) => ({ ...t, projectId: pid!, sortOrder: i })));
    const svc = [...new Set(input.serviceIds)];
    if (svc.length) await tx.insert(projectServices).values(svc.map((serviceId) => ({ projectId: pid!, serviceId })));
    if (input.media.length) await tx.insert(projectMedia).values(input.media.map((m, i) => ({ ...m, projectId: pid!, sortOrder: i })));
    return pid!;
  });

  await audit(staff, {
    action: id ? "project.update" : "project.create",
    entityType: "project",
    entityId: projectId,
    summary: `${id ? "Updated" : "Created"} project "${input.title}"`,
    metadata: { slug: input.slug, published: canPublish ? input.isPublished : undefined, media: input.media.length },
  });
  revalidatePublicSite();
  return ok({ id: projectId, redirectTo: id ? undefined : `/admin/projects/${projectId}` }, id ? "Project saved" : "Project created");
}

function dedupe(list: string[]) {
  const seen = new Set<string>();
  return list.filter((l) => {
    const k = slugify(l);
    if (!k || seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export async function createProject(_prev: unknown, fd: FormData): Promise<Result> {
  return runAction(async () => save(await authorize("projects.write"), null, fd));
}

export async function updateProject(id: string, _prev: unknown, fd: FormData): Promise<Result> {
  return runAction(async () => {
    assertId(id);
    const staff = await authorize("projects.write");
    try {
      return await save(staff, id, fd);
    } catch (e) {
      if (e instanceof Error && e.message === "NOT_FOUND") return fail("Project not found.");
      throw e;
    }
  });
}
