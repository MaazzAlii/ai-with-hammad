import "server-only";

import { publicEnv } from "@/lib/env";
import { listPublishedContent, PLATFORM_LABELS, type ContentCardDTO } from "@/server/dal/public/content";
import { listPublishedProjects, type ProjectCardDTO } from "@/server/dal/public/projects";
import {
  getPublishedService,
  getServiceFeatureTitles,
  listPublishedServices,
  type ServiceDetail,
  type ServiceSummary,
} from "@/server/dal/public/services";
import { getPublicSettings } from "@/server/dal/public/site";
import { listPublishedTeam, type TeamMemberDTO } from "@/server/dal/public/team";
import { listPublishedFaqs, type FaqDTO } from "@/server/dal/public/testimonials";

import { normalizeText, sha256 } from "./hasher";
import type { KnowledgeDocument } from "./types";

function isServiceDetail(s: ServiceDetail | ServiceSummary): s is ServiceDetail {
  return "description" in s && typeof (s as ServiceDetail).description === "string";
}

export async function extractPublishedSiteKnowledge(): Promise<KnowledgeDocument[]> {
  const [settings, services, projects, faqs, team, content] = await Promise.all([
    getPublicSettings().catch(() => null),
    listPublishedServices().catch(() => [] as ServiceSummary[]),
    listPublishedProjects({ limit: 50 }).catch(() => [] as ProjectCardDTO[]),
    listPublishedFaqs().catch(() => [] as FaqDTO[]),
    listPublishedTeam().catch(() => [] as TeamMemberDTO[]),
    listPublishedContent().catch(() => [] as ContentCardDTO[]),
  ]);

  const site = publicEnv.siteUrl.replace(/\/$/, "");
  const docs: KnowledgeDocument[] = [];
  const now = new Date().toISOString();

  // 1. Company & General Information Document
  if (settings) {
    const { general, contact } = settings;
    const lines = [
      `# ${general.siteName}${general.tagline ? ` — ${general.tagline}` : ""}`,
      general.description,
      "",
      "## Contact & Working With Us",
      `- Contact Form: ${site}/contact`,
      general.contactEmail ? `- Email: ${general.contactEmail}` : "",
      general.whatsapp ? `- WhatsApp: ${general.whatsapp}` : "",
      general.location ? `- Location: ${general.location}` : "",
      general.businessHours ? `- Business Hours: ${general.businessHours}` : "",
      `- Sponsorship & Media Kit: ${site}/sponsorship`,
      `- Client Portal: ${site}/portal/login`,
      contact.budgets.length ? `- Typical Budgets: ${contact.budgets.join(", ")}` : "",
      contact.timelines.length ? `- Project Timelines: ${contact.timelines.join(", ")}` : "",
    ].filter(Boolean);

    const body = normalizeText(lines.join("\n"));
    docs.push({
      id: `doc-company-overview`,
      sourceUrl: `${site}/`,
      canonicalUrl: `${site}/`,
      title: `${general.siteName} — Agency Overview`,
      description: general.description,
      sourceType: "website",
      contentHash: sha256(body),
      content: body,
      chunkCount: 0,
      metadata: { section: "company", route: "/" },
      crawledAt: now,
    });
  }

  // 2. Services Documents
  if (services.length > 0) {
    const serviceIds = services.map((s: ServiceSummary) => s.id);
    const featureMap = await getServiceFeatureTitles(serviceIds).catch(() => new Map<string, string[]>());
    const detailedServices: (ServiceDetail | ServiceSummary)[] = await Promise.all(
      services.map(async (s: ServiceSummary) => (await getPublishedService(s.slug).catch(() => null)) ?? s),
    );

    for (const service of detailedServices) {
      const detailed = isServiceDetail(service) ? service : null;
      const features: string[] =
        featureMap.get(service.id) ?? (detailed ? detailed.features.map((f) => f.title) : []);
      const lines = [
        `# Service: ${service.title}`,
        service.summary,
        "",
        detailed?.description ? `## Details\n${detailed.description}` : "",
        features.length ? `## Key Features\n${features.map((f: string) => `- ${f}`).join("\n")}` : "",
        detailed?.processNotes ? `## Process\n${detailed.processNotes}` : "",
        detailed?.technicalNotes ? `## Technical Architecture & Security\n${detailed.technicalNotes}` : "",
        "",
        `Official URL: ${site}/services/${service.slug}`,
      ].filter(Boolean);

      const body = normalizeText(lines.join("\n"));
      docs.push({
        id: `doc-service-${service.slug}`,
        sourceUrl: `${site}/services/${service.slug}`,
        canonicalUrl: `${site}/services/${service.slug}`,
        title: `Service: ${service.title}`,
        description: service.summary,
        sourceType: "website",
        contentHash: sha256(body),
        content: body,
        chunkCount: 0,
        metadata: {
          section: "services",
          slug: service.slug,
          serviceId: service.id,
        },
        crawledAt: now,
      });
    }
  }

  // 3. Projects & Case Studies
  for (const project of projects) {
    const tagLabels = (project.tags ?? []).map((t) => t.label).join(", ");
    const lines = [
      `# Case Study: ${project.title}`,
      project.category ? `Category: ${project.category}` : "",
      project.summary,
      tagLabels ? `Technologies & Topics: ${tagLabels}` : "",
      `Status: ${project.status}`,
      "",
      `Official URL: ${site}/projects/${project.slug}`,
    ].filter(Boolean);

    const body = normalizeText(lines.join("\n"));
    docs.push({
      id: `doc-project-${project.slug}`,
      sourceUrl: `${site}/projects/${project.slug}`,
      canonicalUrl: `${site}/projects/${project.slug}`,
      title: `Case Study: ${project.title}`,
      description: project.summary,
      sourceType: "website",
      contentHash: sha256(body),
      content: body,
      chunkCount: 0,
      metadata: {
        section: "projects",
        slug: project.slug,
        category: project.category,
      },
      crawledAt: now,
    });
  }

  // 4. Team Members
  for (const member of team) {
    const lines = [
      `# Team Member: ${member.name}`,
      `Role: ${member.roleTitle}`,
      member.bio ? `Summary: ${member.bio}` : "",
      member.longBio ? `## Background\n${member.longBio}` : "",
      member.skills?.length ? `Skills: ${member.skills.join(", ")}` : "",
      member.location ? `Location: ${member.location}` : "",
      "",
      `Profile URL: ${site}/team/${member.slug}`,
    ].filter(Boolean);

    const body = normalizeText(lines.join("\n"));
    docs.push({
      id: `doc-team-${member.slug}`,
      sourceUrl: `${site}/team/${member.slug}`,
      canonicalUrl: `${site}/team/${member.slug}`,
      title: `${member.name} — ${member.roleTitle}`,
      description: member.bio || `${member.name} at ${settings?.general.siteName ?? "AI With Hamad"}`,
      sourceType: "website",
      contentHash: sha256(body),
      content: body,
      chunkCount: 0,
      metadata: {
        section: "team",
        slug: member.slug,
      },
      crawledAt: now,
    });
  }

  // 5. Creator Content & Tutorials
  for (const item of content) {
    const platformLabel = PLATFORM_LABELS[item.platform] ?? item.platform;
    const lines = [
      `# Content: ${item.title}`,
      `Platform: ${platformLabel}`,
      item.category ? `Category: ${item.category}` : "",
      item.description ? `Summary: ${item.description}` : "",
      item.bodyMd ? `## Full Tutorial Notes\n${item.bodyMd}` : "",
      "",
      `URL: ${site}/content/${item.slug}`,
    ].filter(Boolean);

    const body = normalizeText(lines.join("\n"));
    docs.push({
      id: `doc-content-${item.slug}`,
      sourceUrl: `${site}/content/${item.slug}`,
      canonicalUrl: `${site}/content/${item.slug}`,
      title: item.title,
      description: item.description,
      sourceType: "website",
      contentHash: sha256(body),
      content: body,
      chunkCount: 0,
      metadata: {
        section: "content",
        platform: item.platform,
        slug: item.slug,
      },
      crawledAt: now,
    });
  }

  // 6. FAQs
  if (faqs.length > 0) {
    const lines = [
      "# Frequently Asked Questions (FAQ)",
      "",
      ...faqs.map((f: FaqDTO) => `### Q: ${f.question}\nA: ${f.answer}\n`),
    ];
    const body = normalizeText(lines.join("\n"));
    docs.push({
      id: `doc-faqs`,
      sourceUrl: `${site}/#faq`,
      canonicalUrl: `${site}/`,
      title: "Frequently Asked Questions",
      description: "Common questions and answers about AI With Hamad services, timelines, and workflows.",
      sourceType: "website",
      contentHash: sha256(body),
      content: body,
      chunkCount: 0,
      metadata: { section: "faq" },
      crawledAt: now,
    });
  }

  return docs;
}
