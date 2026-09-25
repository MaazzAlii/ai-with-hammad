import "@/lib/zod-config";

import { z } from "zod";

/**
 * Typed site settings stored in site_settings (key → jsonb).
 * Every schema has defaults so a missing/partial row still renders.
 */
const titled = z.object({ title: z.string().max(120), body: z.string().max(600) });
const nonNegativeInt = z.coerce.number().int().min(0);

export const settingsSchemas = {
  general: z.object({
    siteName: z.string().min(1).max(80).default("AI With Hamad"),
    tagline: z.string().max(160).default("AI engineering, automation and agentic systems"),
    description: z.string().max(400).default(""),
    contactEmail: z.union([z.literal(""), z.email()]).default(""),
    location: z.string().max(120).default(""),
    phone: z.string().max(40).regex(/^[+()\d\s.-]*$/, "Digits, spaces and + ( ) - only").default(""),
    /** WhatsApp number in international format, e.g. +923001234567 */
    whatsapp: z.string().max(20).regex(/^(\+?\d{7,15})?$/, "International format, e.g. +923001234567").default(""),
    whatsappMessage: z.string().max(200).default(""),
    address: z.string().max(300).default(""),
    businessHours: z.string().max(120).default(""),
    logoMediaId: z.uuid().nullable().default(null),
  }),
  home: z.object({
    heroEyebrow: z.string().max(80).default(""),
    heroTitle: z.string().max(140).default("We build AI systems that do real work."),
    heroSubtitle: z
      .string()
      .max(300)
      .default("We design and ship AI agents, workflow automations and integrations around the tools your team already uses — with a person in the loop where it matters."),
    heroMediaId: z.uuid().nullable().default(null),
    primaryCtaLabel: z.string().max(40).default("Start a project"),
    primaryCtaHref: z.string().max(200).default("/contact"),
    secondaryCtaLabel: z.string().max(40).default("See our work"),
    secondaryCtaHref: z.string().max(200).default("/projects"),
    positioningTitle: z.string().max(140).default(""),
    positioningBody: z.string().max(800).default(""),
    capabilities: z.array(titled).max(12).default([]),
    /** Technologies shown in the "stack we engineer with" strip (tools you actually use). */
    techStack: z.array(z.string().max(40)).max(30).default([]),
    process: z.array(titled).max(8).default([]),
  }),
  about: z.object({
    title: z.string().max(120).default("About"),
    intro: z.string().max(600).default(""),
    body: z.string().max(8000).default(""),
    values: z.array(titled).max(12).default([]),
  }),
  seo: z.object({
    defaultTitle: z.string().max(70).default("AI With Hamad"),
    defaultDescription: z.string().max(170).default(""),
    twitterHandle: z.string().max(30).default(""),
    ogImageMediaId: z.uuid().nullable().default(null),
  }),
  social: z.object({
    links: z
      .array(z.object({ platform: z.string().max(30), url: z.url().refine((u) => u.startsWith("https://"), "Must be https") }))
      .max(20)
      .default([]),
  }),
  sponsorship: z.object({
    intro: z.string().max(800).default(""),
    audienceSummary: z.string().max(1200).default(""),
    audience: z
      .object({
        ageRanges: z.array(z.object({ label: z.string().max(30), percent: z.coerce.number().min(0).max(100) })).max(12).default([]),
        topCountries: z.array(z.object({ label: z.string().max(60), percent: z.coerce.number().min(0).max(100) })).max(12).default([]),
        genderSplit: z.array(z.object({ label: z.string().max(30), percent: z.coerce.number().min(0).max(100) })).max(6).default([]),
        asOf: z.string().max(20).nullable().default(null),
      })
      .default({ ageRanges: [], topCountries: [], genderSplit: [], asOf: null }),
    contentCategories: z.array(z.string().max(60)).max(20).default([]),
    formats: z.array(titled).max(12).default([]),
    whyPartner: z.array(titled).max(12).default([]),
    ratesNotice: z.string().max(200).default("Partnership rates are available upon request."),
    totalReach: nonNegativeInt.nullable().default(null),
  }),
  contact: z.object({
    intro: z.string().max(600).default(""),
    budgets: z.array(z.string().max(60)).max(12).default([]),
    timelines: z.array(z.string().max(60)).max(12).default([]),
  }),
} as const;

export type SettingsKey = keyof typeof settingsSchemas;
export type Settings<K extends SettingsKey> = z.infer<(typeof settingsSchemas)[K]>;

/** Parse a stored value leniently: invalid/missing fields fall back to defaults. */
export function parseSettings<K extends SettingsKey>(key: K, raw: unknown): Settings<K> {
  const schema = settingsSchemas[key];
  const full = schema.safeParse(raw ?? {});
  if (full.success) return full.data as Settings<K>;
  // Drop invalid fields individually rather than discarding the whole object.
  const obj = (raw && typeof raw === "object" ? { ...(raw as Record<string, unknown>) } : {}) as Record<string, unknown>;
  for (const issue of full.error.issues) {
    const top = issue.path[0];
    if (typeof top === "string") delete obj[top];
  }
  const retry = schema.safeParse(obj);
  return (retry.success ? retry.data : schema.parse({})) as Settings<K>;
}
