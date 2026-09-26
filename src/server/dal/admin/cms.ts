import "server-only";

import { asc, desc, eq, isNull } from "drizzle-orm";

import { getDb } from "@/db";
import {
  contentItems,
  contentMetrics,
  legalDocuments,
  navigationItems,
  projectFeatures,
  projectMedia,
  projectMetrics,
  projectServices,
  projectTags,
  projectTeamMembers,
  projects,
  serviceFeatures,
  services,
  socialPlatforms,
  sponsorshipPackageRates,
  sponsorshipPackages,
  sponsorshipPartners,
  teamMembers,
  teamSocialLinks,
} from "@/db/schema";

import { getMediaMany } from "./media";

const db = () => getDb();

/* projects */
export async function listProjectsAdmin() {
  return db()
    .select({ id: projects.id, title: projects.title, slug: projects.slug, category: projects.category, isPublished: projects.isPublished, isFeatured: projects.isFeatured, isPinned: projects.isPinned, updatedAt: projects.updatedAt, coverMediaId: projects.coverMediaId })
    .from(projects)
    .where(isNull(projects.deletedAt))
    .orderBy(asc(projects.sortOrder), desc(projects.createdAt));
}

export async function getProjectForEdit(id: string) {
  const [p] = await db().select().from(projects).where(eq(projects.id, id));
  if (!p || p.deletedAt) return null;
  const [tags, metrics, features, team, svc, media] = await Promise.all([
    db().select().from(projectTags).where(eq(projectTags.projectId, id)).orderBy(asc(projectTags.sortOrder)),
    db().select().from(projectMetrics).where(eq(projectMetrics.projectId, id)).orderBy(asc(projectMetrics.sortOrder)),
    db().select().from(projectFeatures).where(eq(projectFeatures.projectId, id)).orderBy(asc(projectFeatures.sortOrder)),
    db().select().from(projectTeamMembers).where(eq(projectTeamMembers.projectId, id)).orderBy(asc(projectTeamMembers.sortOrder)),
    db().select().from(projectServices).where(eq(projectServices.projectId, id)),
    db().select().from(projectMedia).where(eq(projectMedia.projectId, id)).orderBy(asc(projectMedia.sortOrder)),
  ]);
  const mediaMap = await getMediaMany([p.coverMediaId, ...media.flatMap((m) => [m.mediaAssetId, m.posterMediaId])]);
  return { project: p, tags, metrics, features, team, serviceIds: svc.map((s) => s.serviceId), media, mediaMap };
}

export async function teamOptions() {
  return db().select({ id: teamMembers.id, name: teamMembers.name }).from(teamMembers).where(isNull(teamMembers.deletedAt)).orderBy(asc(teamMembers.name));
}
export async function serviceOptions() {
  return db().select({ id: services.id, title: services.title }).from(services).where(isNull(services.deletedAt)).orderBy(asc(services.sortOrder));
}

/* services */
export async function listServicesAdmin() {
  return db()
    .select({ id: services.id, title: services.title, slug: services.slug, isPublished: services.isPublished, isFeatured: services.isFeatured, updatedAt: services.updatedAt })
    .from(services)
    .where(isNull(services.deletedAt))
    .orderBy(asc(services.sortOrder));
}
export async function getServiceForEdit(id: string) {
  const [s] = await db().select().from(services).where(eq(services.id, id));
  if (!s || s.deletedAt) return null;
  const features = await db().select().from(serviceFeatures).where(eq(serviceFeatures.serviceId, id)).orderBy(asc(serviceFeatures.sortOrder));
  const mediaMap = await getMediaMany([s.coverMediaId]);
  return { service: s, features, cover: s.coverMediaId ? (mediaMap.get(s.coverMediaId) ?? null) : null };
}

/* team */
export async function listTeamAdmin() {
  return db()
    .select({ id: teamMembers.id, name: teamMembers.name, slug: teamMembers.slug, roleTitle: teamMembers.roleTitle, isPublished: teamMembers.isPublished, isFeatured: teamMembers.isFeatured, isLocked: teamMembers.isLocked, photoMediaId: teamMembers.photoMediaId })
    .from(teamMembers)
    .where(isNull(teamMembers.deletedAt))
    .orderBy(asc(teamMembers.sortOrder), asc(teamMembers.name));
}
export async function getTeamMemberForEdit(id: string) {
  const [m] = await db().select().from(teamMembers).where(eq(teamMembers.id, id));
  if (!m || m.deletedAt) return null;
  const links = await db().select().from(teamSocialLinks).where(eq(teamSocialLinks.teamMemberId, id)).orderBy(asc(teamSocialLinks.sortOrder));
  const mediaMap = await getMediaMany([m.photoMediaId]);
  return { member: m, links, photo: m.photoMediaId ? (mediaMap.get(m.photoMediaId) ?? null) : null };
}

/* content */
export async function listContentAdmin() {
  return db()
    .select({ id: contentItems.id, title: contentItems.title, slug: contentItems.slug, platform: contentItems.platform, publishedDate: contentItems.publishedDate, isPublished: contentItems.isPublished, isFeatured: contentItems.isFeatured, isHighPerforming: contentItems.isHighPerforming, isCampaign: contentItems.isCampaign, isCaseStudy: contentItems.isCaseStudy, performanceRank: contentItems.performanceRank })
    .from(contentItems)
    .where(isNull(contentItems.deletedAt))
    .orderBy(asc(contentItems.sortOrder), desc(contentItems.publishedDate));
}
export async function getContentForEdit(id: string) {
  const [c] = await db().select().from(contentItems).where(eq(contentItems.id, id));
  if (!c || c.deletedAt) return null;
  const metrics = await db().select().from(contentMetrics).where(eq(contentMetrics.contentItemId, id)).orderBy(desc(contentMetrics.capturedAt)).limit(20);
  const mediaMap = await getMediaMany([c.thumbnailMediaId]);
  return { item: c, metrics, thumbnail: c.thumbnailMediaId ? (mediaMap.get(c.thumbnailMediaId) ?? null) : null };
}
export async function listSocialAdmin() {
  return db().select().from(socialPlatforms).orderBy(asc(socialPlatforms.sortOrder));
}

/* sponsorship */
export async function listPackagesAdmin() {
  return db().select().from(sponsorshipPackages).where(isNull(sponsorshipPackages.deletedAt)).orderBy(asc(sponsorshipPackages.sortOrder));
}
/** INTERNAL rates — callers must hold sponsorship.rates. */
export async function getPackageRates(packageId: string) {
  const [r] = await db().select().from(sponsorshipPackageRates).where(eq(sponsorshipPackageRates.packageId, packageId));
  return r ?? null;
}
export async function listPartnersAdmin() {
  return db().select().from(sponsorshipPartners).where(isNull(sponsorshipPartners.deletedAt)).orderBy(asc(sponsorshipPartners.sortOrder));
}

/* site */
export async function listNavigationAdmin() {
  return db().select().from(navigationItems).orderBy(asc(navigationItems.location), asc(navigationItems.sortOrder));
}
export async function listLegalAdmin() {
  return db().select().from(legalDocuments).orderBy(asc(legalDocuments.slug));
}
