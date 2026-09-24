import { z } from "zod";

import { contentPlatform, inquiryPriority, inquiryStatus, projectMediaType } from "@/db/schema";
import { ROLES } from "@/lib/permissions";

/* ----------------------------- field helpers ----------------------------- */

export const checkbox = z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean());

const emptyToNull = (v: unknown) => (typeof v === "string" && v.trim() === "" ? null : v);

export const slug = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Required")
  .max(80)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, numbers and single hyphens");

export const title = (max = 160) => z.string().trim().min(1, "Required").max(max);
export const optText = (max: number) => z.string().trim().max(max).optional().default("");

export const httpUrl = z
  .string()
  .trim()
  .max(500)
  .refine((v) => {
    try {
      const u = new URL(v);
      return (u.protocol === "https:" || u.protocol === "http:") && !u.username && !u.password;
    } catch {
      return false;
    }
  }, "Enter a full URL starting with https://");

export const httpsUrl = httpUrl.refine((v) => v.startsWith("https://"), "Must start with https://");

export const optUrl = z.preprocess(emptyToNull, httpUrl.nullable()).optional().default(null);
export const optHttpsUrl = z.preprocess(emptyToNull, httpsUrl.nullable()).optional().default(null);
export const optUuid = z.preprocess(emptyToNull, z.uuid().nullable()).optional().default(null);
export const optInt = (min: number, max: number) => z.preprocess(emptyToNull, z.coerce.number().int().min(min).max(max).nullable()).optional().default(null);
export const optNumber = (min: number, max: number) => z.preprocess(emptyToNull, z.coerce.number().min(min).max(max).nullable()).optional().default(null);
export const optDate = z.preprocess(emptyToNull, z.iso.date().nullable()).optional().default(null);

/** JSON-encoded array coming from a RepeaterField hidden input. */
export function jsonArray<T extends z.ZodType>(item: T, max = 50) {
  return z.preprocess((v) => {
    if (typeof v !== "string") return v ?? [];
    if (v.trim() === "") return [];
    try {
      return JSON.parse(v);
    } catch {
      return v;
    }
  }, z.array(item).max(max)).optional().default([]) as unknown as z.ZodDefault<z.ZodArray<T>>;
}

/** Comma- or newline-separated list. */
export const stringList = (maxItems = 30, maxLen = 60) =>
  z.preprocess(
    (v) => (typeof v === "string" ? v.split(/[\n,]/).map((s) => s.trim()).filter(Boolean) : (v ?? [])),
    z.array(z.string().max(maxLen)).max(maxItems),
  );

const seo = {
  seoTitle: z.preprocess(emptyToNull, z.string().trim().max(70).nullable()).optional().default(null),
  seoDescription: z.preprocess(emptyToNull, z.string().trim().max(170).nullable()).optional().default(null),
};

const flags = {
  isPublished: checkbox,
  isFeatured: checkbox,
};

/* -------------------------------- services -------------------------------- */

export const serviceSchema = z.object({
  title: title(),
  slug,
  summary: optText(400),
  description: optText(20000),
  icon: z.string().max(30).default("sparkles"),
  coverMediaId: optUuid,
  ...seo,
  ...flags,
  features: jsonArray(z.object({ title: title(120), description: optText(400) }), 20),
});

/* ---------------------------------- team ---------------------------------- */

export const teamMemberSchema = z.object({
  name: title(120),
  slug,
  roleTitle: optText(120),
  bio: optText(600),
  longBio: optText(20000),
  photoMediaId: optUuid,
  skills: stringList(30, 50),
  location: optText(120),
  websiteUrl: optUrl,
  ...flags,
  links: jsonArray(z.object({ platform: title(30), url: httpUrl, label: optText(60) }), 12),
});

/* -------------------------------- projects -------------------------------- */

export const projectMediaItemSchema = z
  .object({
    type: z.enum(projectMediaType.enumValues),
    mediaAssetId: optUuid,
    externalUrl: z.preprocess(emptyToNull, httpsUrl.nullable()).optional().default(null),
    posterMediaId: optUuid,
    title: optText(160),
    caption: optText(500),
    altText: optText(300),
  })
  .superRefine((m, ctx) => {
    const external = m.type === "youtube" || m.type === "vimeo" || m.type === "external";
    if (external && !m.externalUrl) ctx.addIssue({ code: "custom", message: "A URL is required for this media type", path: ["externalUrl"] });
    if (!external && !m.mediaAssetId) ctx.addIssue({ code: "custom", message: "Choose a file from the media library", path: ["mediaAssetId"] });
  });

export const projectSchema = z.object({
  title: title(),
  slug,
  subtitle: optText(200),
  summary: optText(500),
  category: optText(60),
  clientName: optText(120),
  industry: optText(80),
  projectYear: optInt(1990, 2100),
  projectUrl: optUrl,
  repositoryUrl: optUrl,
  coverMediaId: optUuid,
  overview: optText(20000),
  problem: optText(20000),
  approach: optText(20000),
  architecture: optText(20000),
  implementation: optText(20000),
  results: optText(20000),
  ...seo,
  ...flags,
  isPinned: checkbox,
  technologies: stringList(30, 40),
  topics: stringList(20, 40),
  metrics: jsonArray(z.object({ label: title(80), value: title(40), description: optText(200) }), 12),
  features: jsonArray(z.object({ title: title(120), description: optText(400) }), 20),
  team: jsonArray(z.object({ teamMemberId: z.uuid(), roleOnProject: optText(80) }), 20),
  serviceIds: jsonArray(z.uuid(), 20),
  media: jsonArray(projectMediaItemSchema, 60),
});

/* -------------------------------- content --------------------------------- */

export const contentItemSchema = z.object({
  title: title(),
  slug,
  platform: z.enum(contentPlatform.enumValues),
  socialPlatformId: optUuid,
  url: httpsUrl,
  embedUrl: optHttpsUrl,
  thumbnailMediaId: optUuid,
  description: optText(5000),
  publishedDate: optDate,
  category: optText(60),
  ...flags,
  isHighPerforming: checkbox,
  isCampaign: checkbox,
  isCaseStudy: checkbox,
  performanceRank: optInt(1, 10000),
});

export const contentMetricsSchema = z.object({
  views: optInt(0, 1e13),
  likes: optInt(0, 1e13),
  comments: optInt(0, 1e13),
  shares: optInt(0, 1e13),
  engagementRate: optNumber(0, 1000),
  capturedAt: optDate,
});

export const socialPlatformSchema = z.object({
  platform: z.enum(contentPlatform.enumValues),
  handle: title(60),
  displayName: optText(80),
  profileUrl: httpsUrl,
  description: optText(300),
  followers: optInt(0, 1e12),
  followersUpdatedAt: optDate,
  isActive: checkbox,
});

/* ------------------------------- sponsorship ------------------------------ */

export const packageSchema = z.object({
  name: title(120),
  slug,
  summary: optText(600),
  deliverables: stringList(20, 160),
  platforms: z.preprocess((v) => (Array.isArray(v) ? v : typeof v === "string" && v ? [v] : []), z.array(z.enum(contentPlatform.enumValues)).max(7)),
  isPublished: checkbox,
});

export const ratesSchema = z
  .object({
    currency: z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/, "3-letter currency code").default("USD"),
    standardRate: optNumber(0, 1e9),
    minimumRate: optNumber(0, 1e9),
    packageNotes: optText(4000),
    negotiationNotes: optText(4000),
  })
  .refine((r) => r.minimumRate == null || r.standardRate == null || r.minimumRate <= r.standardRate, {
    message: "Minimum rate cannot exceed the standard rate",
    path: ["minimumRate"],
  });

export const partnerSchema = z.object({
  name: title(120),
  slug,
  logoMediaId: optUuid,
  websiteUrl: optUrl,
  description: optText(1000),
  campaignSummary: optText(1000),
  partneredOn: optDate,
  isPublished: checkbox,
});

/* -------------------------------- inquiries ------------------------------- */

export const inquiryUpdateSchema = z.object({
  status: z.enum(inquiryStatus.enumValues),
  priority: z.enum(inquiryPriority.enumValues),
  assignedTo: optUuid,
});

export const noteSchema = z.object({ body: z.string().trim().min(1, "Write a note").max(5000) });

/* --------------------------------- media ---------------------------------- */

export const finalizeUploadSchema = z.object({
  bucket: z.string().max(40),
  path: z.string().max(200),
  originalFilename: z.string().trim().min(1).max(200),
  mimeType: z.string().max(100),
  size: z.number().int().positive(),
  width: z.number().int().positive().nullable().optional(),
  height: z.number().int().positive().nullable().optional(),
  durationSeconds: z.number().nonnegative().nullable().optional(),
  altText: optText(300),
  replaceId: z.uuid().optional(),
});

export const mediaUpdateSchema = z.object({
  filename: title(200),
  altText: optText(300),
  caption: optText(500),
});

/* ---------------------------- navigation / legal --------------------------- */

export const navItemSchema = z.object({
  location: z.enum(["header", "footer", "legal"]),
  label: title(60),
  href: z
    .string()
    .trim()
    .max(300)
    .refine((v) => (/^\/(?!\/)/.test(v) && !/\s/.test(v)) || /^https:\/\/\S+$/.test(v), "Use an internal path like /projects or an https:// URL"),
  isVisible: checkbox,
});

export const legalSchema = z.object({
  title: title(120),
  body: z.string().max(100000),
  effectiveOn: optDate,
  isPublished: checkbox,
});

/* ---------------------------------- users --------------------------------- */

export const inviteUserSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email")),
  fullName: optText(120),
  role: z.enum(ROLES),
});

export const userUpdateSchema = z.object({
  role: z.enum(ROLES),
  isActive: checkbox,
  fullName: optText(120),
});

export const reorderSchema = z.object({ ids: z.array(z.uuid()).min(1).max(500) });
