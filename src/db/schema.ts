/**
 * Drizzle schema — typed mirror of supabase/AI_WITH_HAMAD_SETUP.sql.
 *
 * The SQL file is canonical (it also contains RLS, triggers, storage and seed
 * data that Drizzle cannot express). tests/db/schema-consistency.test.ts
 * fails if a table or column here drifts from the database built by the SQL.
 */
import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  char,
  date,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  type AnyPgColumn,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------
export const appRole = pgEnum("app_role", ["owner", "admin", "manager", "editor", "viewer"]);
export const inquiryStatus = pgEnum("inquiry_status", [
  "new",
  "contacted",
  "qualified",
  "proposal",
  "won",
  "lost",
  "archived",
]);
export const inquiryPriority = pgEnum("inquiry_priority", ["low", "normal", "high", "urgent"]);
export const contentPlatform = pgEnum("content_platform", [
  "tiktok",
  "youtube",
  "instagram",
  "facebook",
  "linkedin",
  "x",
  "other",
]);
export const mediaKind = pgEnum("media_kind", ["image", "video", "document", "other"]);
export const projectMediaType = pgEnum("project_media_type", [
  "image",
  "screenshot",
  "diagram",
  "video_upload",
  "youtube",
  "vimeo",
  "external",
  "document",
]);
export const tagKind = pgEnum("tag_kind", ["technology", "topic"]);
export const navLocation = pgEnum("nav_location", ["header", "footer", "legal"]);
export const accountKind = pgEnum("account_kind", ["staff", "client"]);
export const threadStatus = pgEnum("thread_status", ["open", "closed"]);
export const testimonialStatus = pgEnum("testimonial_status", ["pending", "approved", "rejected"]);

export type AppRole = (typeof appRole.enumValues)[number];
export type InquiryStatus = (typeof inquiryStatus.enumValues)[number];
export type InquiryPriority = (typeof inquiryPriority.enumValues)[number];
export type ContentPlatform = (typeof contentPlatform.enumValues)[number];
export type MediaKind = (typeof mediaKind.enumValues)[number];
export type ProjectMediaType = (typeof projectMediaType.enumValues)[number];
export type NavLocation = (typeof navLocation.enumValues)[number];
export type AccountKind = (typeof accountKind.enumValues)[number];
export type ThreadStatus = (typeof threadStatus.enumValues)[number];
export type TestimonialStatus = (typeof testimonialStatus.enumValues)[number];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const ts = (name: string) => timestamp(name, { withTimezone: true });
const createdAt = () => ts("created_at").notNull().defaultNow();
const updatedAt = () =>
  ts("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());
const id = () => uuid("id").primaryKey().defaultRandom();

// ---------------------------------------------------------------------------
// Identity & access
// ---------------------------------------------------------------------------
export const roles = pgTable("roles", {
  key: appRole("key").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  rank: integer("rank").notNull(),
  createdAt: createdAt(),
});

export const permissions = pgTable("permissions", {
  key: text("key").primaryKey(),
  description: text("description").notNull().default(""),
  createdAt: createdAt(),
});

export const rolePermissions = pgTable(
  "role_permissions",
  {
    role: appRole("role")
      .notNull()
      .references(() => roles.key, { onDelete: "cascade" }),
    permissionKey: text("permission_key")
      .notNull()
      .references(() => permissions.key, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.role, t.permissionKey] })],
);

export const profiles = pgTable("profiles", {
  // FK to auth.users(id) ON DELETE CASCADE is defined in the SQL setup
  // (auth schema is managed by Supabase and not modelled here).
  id: uuid("id").primaryKey(),
  email: text("email").notNull(),
  fullName: text("full_name").notNull().default(""),
  avatarUrl: text("avatar_url"),
  role: appRole("role")
    .notNull()
    .default("viewer")
    .references(() => roles.key),
  kind: accountKind("kind").notNull().default("staff"),
  /** Portal users (kind = client) belong to one client. */
  clientId: uuid("client_id").references((): AnyPgColumn => clients.id, { onDelete: "set null" }),
  isActive: boolean("is_active").notNull().default(false),
  lastSignInAt: ts("last_sign_in_at"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

// ---------------------------------------------------------------------------
// Media
// ---------------------------------------------------------------------------
export const mediaAssets = pgTable("media_assets", {
  id: id(),
  bucket: text("bucket").notNull(),
  path: text("path").notNull(),
  filename: text("filename").notNull(),
  originalFilename: text("original_filename").notNull(),
  mimeType: text("mime_type").notNull(),
  kind: mediaKind("kind").notNull(),
  sizeBytes: bigint("size_bytes", { mode: "number" }).notNull(),
  width: integer("width"),
  height: integer("height"),
  durationSeconds: numeric("duration_seconds", { precision: 10, scale: 2, mode: "number" }),
  altText: text("alt_text").notNull().default(""),
  caption: text("caption").notNull().default(""),
  isPublic: boolean("is_public").notNull().default(true),
  uploadedBy: uuid("uploaded_by").references(() => profiles.id, { onDelete: "set null" }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
  deletedAt: ts("deleted_at"),
});

// ---------------------------------------------------------------------------
// Services
// ---------------------------------------------------------------------------
export const services = pgTable("services", {
  id: id(),
  slug: text("slug").notNull(),
  title: text("title").notNull(),
  summary: text("summary").notNull().default(""),
  description: text("description").notNull().default(""),
  icon: text("icon").notNull().default("sparkles"),
  coverMediaId: uuid("cover_media_id").references(() => mediaAssets.id, { onDelete: "set null" }),
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  isPublished: boolean("is_published").notNull().default(false),
  publishedAt: ts("published_at"),
  isFeatured: boolean("is_featured").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
  deletedAt: ts("deleted_at"),
});

export const serviceFeatures = pgTable("service_features", {
  id: id(),
  serviceId: uuid("service_id")
    .notNull()
    .references(() => services.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: createdAt(),
});

// ---------------------------------------------------------------------------
// Team
// ---------------------------------------------------------------------------
export const teamMembers = pgTable("team_members", {
  id: id(),
  slug: text("slug").notNull(),
  name: text("name").notNull(),
  roleTitle: text("role_title").notNull().default(""),
  bio: text("bio").notNull().default(""),
  longBio: text("long_bio").notNull().default(""),
  photoMediaId: uuid("photo_media_id").references(() => mediaAssets.id, { onDelete: "set null" }),
  skills: text("skills").array().notNull().default(sql`'{}'::text[]`),
  location: text("location").notNull().default(""),
  websiteUrl: text("website_url"),
  isPublished: boolean("is_published").notNull().default(false),
  publishedAt: ts("published_at"),
  isFeatured: boolean("is_featured").notNull().default(false),
  /** Founders: name/slug fixed, cannot be deleted (DB trigger enforces). */
  isLocked: boolean("is_locked").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
  deletedAt: ts("deleted_at"),
});

export const teamSocialLinks = pgTable("team_social_links", {
  id: id(),
  teamMemberId: uuid("team_member_id")
    .notNull()
    .references(() => teamMembers.id, { onDelete: "cascade" }),
  platform: text("platform").notNull(),
  url: text("url").notNull(),
  label: text("label").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: createdAt(),
});

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------
export const projects = pgTable("projects", {
  id: id(),
  slug: text("slug").notNull(),
  title: text("title").notNull(),
  subtitle: text("subtitle").notNull().default(""),
  summary: text("summary").notNull().default(""),
  category: text("category").notNull().default(""),
  clientName: text("client_name").notNull().default(""),
  industry: text("industry").notNull().default(""),
  projectYear: integer("project_year"),
  projectUrl: text("project_url"),
  repositoryUrl: text("repository_url"),
  coverMediaId: uuid("cover_media_id").references(() => mediaAssets.id, { onDelete: "set null" }),
  overview: text("overview").notNull().default(""),
  problem: text("problem").notNull().default(""),
  approach: text("approach").notNull().default(""),
  architecture: text("architecture").notNull().default(""),
  implementation: text("implementation").notNull().default(""),
  results: text("results").notNull().default(""),
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  isPublished: boolean("is_published").notNull().default(false),
  publishedAt: ts("published_at"),
  isFeatured: boolean("is_featured").notNull().default(false),
  isPinned: boolean("is_pinned").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
  deletedAt: ts("deleted_at"),
});

export const projectMedia = pgTable("project_media", {
  id: id(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  type: projectMediaType("type").notNull(),
  mediaAssetId: uuid("media_asset_id").references(() => mediaAssets.id, { onDelete: "restrict" }),
  externalUrl: text("external_url"),
  posterMediaId: uuid("poster_media_id").references(() => mediaAssets.id, { onDelete: "set null" }),
  title: text("title").notNull().default(""),
  caption: text("caption").notNull().default(""),
  altText: text("alt_text").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: createdAt(),
});

export const projectMetrics = pgTable("project_metrics", {
  id: id(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  value: text("value").notNull(),
  description: text("description").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: createdAt(),
});

export const projectTags = pgTable("project_tags", {
  id: id(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  kind: tagKind("kind").notNull().default("technology"),
  label: text("label").notNull(),
  slug: text("slug").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const projectFeatures = pgTable("project_features", {
  id: id(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: createdAt(),
});

export const projectTeamMembers = pgTable(
  "project_team_members",
  {
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    teamMemberId: uuid("team_member_id")
      .notNull()
      .references(() => teamMembers.id, { onDelete: "cascade" }),
    roleOnProject: text("role_on_project").notNull().default(""),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.projectId, t.teamMemberId] })],
);

export const projectServices = pgTable(
  "project_services",
  {
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    serviceId: uuid("service_id")
      .notNull()
      .references(() => services.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.projectId, t.serviceId] })],
);

// ---------------------------------------------------------------------------
// Content creator
// ---------------------------------------------------------------------------
export const socialPlatforms = pgTable("social_platforms", {
  id: id(),
  platform: contentPlatform("platform").notNull(),
  handle: text("handle").notNull(),
  displayName: text("display_name").notNull().default(""),
  profileUrl: text("profile_url").notNull(),
  description: text("description").notNull().default(""),
  followers: bigint("followers", { mode: "number" }),
  followersUpdatedAt: date("followers_updated_at"),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const contentItems = pgTable("content_items", {
  id: id(),
  slug: text("slug").notNull(),
  title: text("title").notNull(),
  platform: contentPlatform("platform").notNull(),
  socialPlatformId: uuid("social_platform_id").references(() => socialPlatforms.id, {
    onDelete: "set null",
  }),
  url: text("url").notNull(),
  embedUrl: text("embed_url"),
  thumbnailMediaId: uuid("thumbnail_media_id").references(() => mediaAssets.id, {
    onDelete: "set null",
  }),
  description: text("description").notNull().default(""),
  publishedDate: date("published_date"),
  category: text("category").notNull().default(""),
  isFeatured: boolean("is_featured").notNull().default(false),
  isHighPerforming: boolean("is_high_performing").notNull().default(false),
  isCampaign: boolean("is_campaign").notNull().default(false),
  isCaseStudy: boolean("is_case_study").notNull().default(false),
  performanceRank: integer("performance_rank"),
  isPublished: boolean("is_published").notNull().default(false),
  publishedAt: ts("published_at"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
  deletedAt: ts("deleted_at"),
});

export const contentMetrics = pgTable("content_metrics", {
  id: id(),
  contentItemId: uuid("content_item_id")
    .notNull()
    .references(() => contentItems.id, { onDelete: "cascade" }),
  capturedAt: ts("captured_at").notNull().defaultNow(),
  views: bigint("views", { mode: "number" }),
  likes: bigint("likes", { mode: "number" }),
  comments: bigint("comments", { mode: "number" }),
  shares: bigint("shares", { mode: "number" }),
  engagementRate: numeric("engagement_rate", { precision: 6, scale: 3, mode: "number" }),
  source: text("source").notNull().default("manual"),
  createdAt: createdAt(),
});

// ---------------------------------------------------------------------------
// Sponsorship
// ---------------------------------------------------------------------------
export const sponsorshipPartners = pgTable("sponsorship_partners", {
  id: id(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  logoMediaId: uuid("logo_media_id").references(() => mediaAssets.id, { onDelete: "set null" }),
  websiteUrl: text("website_url"),
  description: text("description").notNull().default(""),
  campaignSummary: text("campaign_summary").notNull().default(""),
  partneredOn: date("partnered_on"),
  isPublished: boolean("is_published").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
  deletedAt: ts("deleted_at"),
});

export const sponsorshipPackages = pgTable("sponsorship_packages", {
  id: id(),
  slug: text("slug").notNull(),
  name: text("name").notNull(),
  summary: text("summary").notNull().default(""),
  deliverables: text("deliverables").array().notNull().default(sql`'{}'::text[]`),
  platforms: contentPlatform("platforms").array().notNull().default(sql`'{}'::content_platform[]`),
  isPublished: boolean("is_published").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
  deletedAt: ts("deleted_at"),
});

/** INTERNAL — never select from public code paths. */
export const sponsorshipPackageRates = pgTable("sponsorship_package_rates", {
  packageId: uuid("package_id")
    .primaryKey()
    .references(() => sponsorshipPackages.id, { onDelete: "cascade" }),
  currency: char("currency", { length: 3 }).notNull().default("USD"),
  standardRate: numeric("standard_rate", { precision: 12, scale: 2, mode: "number" }),
  minimumRate: numeric("minimum_rate", { precision: 12, scale: 2, mode: "number" }),
  packageNotes: text("package_notes").notNull().default(""),
  negotiationNotes: text("negotiation_notes").notNull().default(""),
  updatedBy: uuid("updated_by").references(() => profiles.id, { onDelete: "set null" }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const sponsorshipInquiries = pgTable("sponsorship_inquiries", {
  id: id(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  company: text("company").notNull().default(""),
  website: text("website").notNull().default(""),
  packageId: uuid("package_id").references(() => sponsorshipPackages.id, { onDelete: "set null" }),
  platforms: contentPlatform("platforms").array().notNull().default(sql`'{}'::content_platform[]`),
  budgetRange: text("budget_range").notNull().default(""),
  timeline: text("timeline").notNull().default(""),
  campaignGoals: text("campaign_goals").notNull().default(""),
  message: text("message").notNull(),
  status: inquiryStatus("status").notNull().default("new"),
  priority: inquiryPriority("priority").notNull().default("normal"),
  assignedTo: uuid("assigned_to").references(() => profiles.id, { onDelete: "set null" }),
  sourcePath: text("source_path").notNull().default(""),
  ipHash: text("ip_hash"),
  userAgent: text("user_agent").notNull().default(""),
  emailStatus: text("email_status").notNull().default("pending"),
  contactedAt: ts("contacted_at"),
  closedAt: ts("closed_at"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

// ---------------------------------------------------------------------------
// CRM
// ---------------------------------------------------------------------------
export const contactInquiries = pgTable("contact_inquiries", {
  id: id(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  company: text("company").notNull().default(""),
  phone: text("phone").notNull().default(""),
  serviceId: uuid("service_id").references(() => services.id, { onDelete: "set null" }),
  serviceLabel: text("service_label").notNull().default(""),
  budget: text("budget").notNull().default(""),
  timeline: text("timeline").notNull().default(""),
  message: text("message").notNull(),
  status: inquiryStatus("status").notNull().default("new"),
  priority: inquiryPriority("priority").notNull().default("normal"),
  assignedTo: uuid("assigned_to").references(() => profiles.id, { onDelete: "set null" }),
  sourcePath: text("source_path").notNull().default(""),
  ipHash: text("ip_hash"),
  userAgent: text("user_agent").notNull().default(""),
  emailStatus: text("email_status").notNull().default("pending"),
  contactedAt: ts("contacted_at"),
  closedAt: ts("closed_at"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const inquiryNotes = pgTable("inquiry_notes", {
  id: id(),
  contactInquiryId: uuid("contact_inquiry_id").references(() => contactInquiries.id, {
    onDelete: "cascade",
  }),
  sponsorshipInquiryId: uuid("sponsorship_inquiry_id").references(() => sponsorshipInquiries.id, {
    onDelete: "cascade",
  }),
  authorId: uuid("author_id").references(() => profiles.id, { onDelete: "set null" }),
  body: text("body").notNull(),
  createdAt: createdAt(),
});

// ---------------------------------------------------------------------------
// Client portal
// ---------------------------------------------------------------------------
export const clients = pgTable("clients", {
  id: id(),
  companyName: text("company_name").notNull(),
  contactName: text("contact_name").notNull().default(""),
  email: text("email").notNull().default(""),
  phone: text("phone").notNull().default(""),
  whatsapp: text("whatsapp").notNull().default(""),
  notes: text("notes").notNull().default(""),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const messageThreads = pgTable("message_threads", {
  id: id(),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  subject: text("subject").notNull(),
  status: threadStatus("status").notNull().default("open"),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
  createdBy: uuid("created_by").references(() => profiles.id, { onDelete: "set null" }),
  lastMessageAt: ts("last_message_at").notNull().defaultNow(),
  staffLastReadAt: ts("staff_last_read_at"),
  clientLastReadAt: ts("client_last_read_at"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const messages = pgTable("messages", {
  id: id(),
  threadId: uuid("thread_id")
    .notNull()
    .references(() => messageThreads.id, { onDelete: "cascade" }),
  authorId: uuid("author_id").references(() => profiles.id, { onDelete: "set null" }),
  authorKind: accountKind("author_kind").notNull(),
  body: text("body").notNull(),
  createdAt: createdAt(),
});

export const testimonials = pgTable("testimonials", {
  id: id(),
  clientId: uuid("client_id").references(() => clients.id, { onDelete: "set null" }),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
  submittedBy: uuid("submitted_by").references(() => profiles.id, { onDelete: "set null" }),
  source: text("source").notNull().default("portal"),
  authorName: text("author_name").notNull(),
  authorTitle: text("author_title").notNull().default(""),
  company: text("company").notNull().default(""),
  quote: text("quote").notNull(),
  rating: smallint("rating").notNull(),
  photoMediaId: uuid("photo_media_id").references(() => mediaAssets.id, { onDelete: "set null" }),
  consentToPublish: boolean("consent_to_publish").notNull().default(false),
  status: testimonialStatus("status").notNull().default("pending"),
  isPublished: boolean("is_published").notNull().default(false),
  isFeatured: boolean("is_featured").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  publishedAt: ts("published_at"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
  deletedAt: ts("deleted_at"),
});

export const faqs = pgTable("faqs", {
  id: id(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  category: text("category").notNull().default(""),
  isPublished: boolean("is_published").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
  deletedAt: ts("deleted_at"),
});

// ---------------------------------------------------------------------------
// Site
// ---------------------------------------------------------------------------
export const siteSettings = pgTable("site_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull().default({}),
  updatedBy: uuid("updated_by").references(() => profiles.id, { onDelete: "set null" }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const navigationItems = pgTable("navigation_items", {
  id: id(),
  location: navLocation("location").notNull(),
  label: text("label").notNull(),
  href: text("href").notNull(),
  parentId: uuid("parent_id"),
  isExternal: boolean("is_external").notNull().default(false),
  isVisible: boolean("is_visible").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const legalDocuments = pgTable("legal_documents", {
  slug: text("slug").primaryKey(),
  title: text("title").notNull(),
  body: text("body").notNull().default(""),
  isPublished: boolean("is_published").notNull().default(true),
  effectiveOn: date("effective_on"),
  updatedBy: uuid("updated_by").references(() => profiles.id, { onDelete: "set null" }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

// ---------------------------------------------------------------------------
// Ops
// ---------------------------------------------------------------------------
export const auditLogs = pgTable("audit_logs", {
  id: id(),
  actorId: uuid("actor_id").references(() => profiles.id, { onDelete: "set null" }),
  actorEmail: text("actor_email").notNull().default(""),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull().default(""),
  entityId: text("entity_id"),
  summary: text("summary").notNull().default(""),
  metadata: jsonb("metadata").notNull().default({}),
  ipHash: text("ip_hash"),
  createdAt: createdAt(),
});

export const rateLimits = pgTable(
  "rate_limits",
  {
    key: text("key").notNull(),
    windowStart: ts("window_start").notNull(),
    count: integer("count").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.key, t.windowStart] })],
);

/** Every public-schema table, used by the schema consistency test. */
export const publicTables = {
  roles,
  permissions,
  rolePermissions,
  profiles,
  mediaAssets,
  services,
  serviceFeatures,
  teamMembers,
  teamSocialLinks,
  projects,
  projectMedia,
  projectMetrics,
  projectTags,
  projectFeatures,
  projectTeamMembers,
  projectServices,
  socialPlatforms,
  contentItems,
  contentMetrics,
  sponsorshipPartners,
  sponsorshipPackages,
  sponsorshipPackageRates,
  sponsorshipInquiries,
  contactInquiries,
  inquiryNotes,
  siteSettings,
  navigationItems,
  legalDocuments,
  auditLogs,
  rateLimits,
  clients,
  messageThreads,
  messages,
  testimonials,
  faqs,
};
