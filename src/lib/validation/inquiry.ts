import { z } from "zod";

import { contentPlatform } from "@/db/schema";

const text = (max: number) => z.string().trim().max(max, `Must be at most ${max} characters`);
const optionalText = (max: number) => text(max).optional().default("");

/** Anti-spam fields present on every public form. */
export const antiSpamSchema = z.object({
  /** Honeypot: hidden from humans; bots fill it. Must be empty. */
  website_url_confirm: z.string().max(0).optional().default(""),
  /** Epoch ms when the form was rendered; submissions faster than MIN_FILL_MS are rejected. */
  started_at: z.coerce.number().int().positive().optional(),
});

export const MIN_FILL_MS = 2500;

export const contactInquirySchema = z.object({
  name: text(120).min(2, "Please enter your name"),
  email: z.string().trim().toLowerCase().max(254).pipe(z.email("Please enter a valid email address")),
  company: optionalText(160),
  phone: optionalText(40).refine((v) => v === "" || /^[+()\d\s.-]{6,40}$/.test(v), "Please enter a valid phone number"),
  serviceId: z.union([z.literal(""), z.uuid()]).optional().default(""),
  budget: optionalText(60),
  timeline: optionalText(60),
  message: text(5000).min(20, "Please tell us a little more (at least 20 characters)"),
});

export type ContactInquiryInput = z.input<typeof contactInquirySchema>;

export const sponsorshipInquirySchema = z.object({
  name: text(120).min(2, "Please enter your name"),
  email: z.string().trim().toLowerCase().max(254).pipe(z.email("Please enter a valid email address")),
  company: text(160).min(2, "Please enter your company or brand"),
  website: optionalText(300).refine((v) => v === "" || /^https?:\/\/\S+\.\S+/.test(v), "Please enter a full URL starting with https://"),
  packageId: z.union([z.literal(""), z.uuid()]).optional().default(""),
  platforms: z.array(z.enum(contentPlatform.enumValues)).max(7).optional().default([]),
  budgetRange: optionalText(60),
  timeline: optionalText(60),
  campaignGoals: optionalText(2000),
  message: text(5000).min(20, "Please tell us a little more (at least 20 characters)"),
});

export type SponsorshipInquiryInput = z.input<typeof sponsorshipInquirySchema>;

/** Very long messages full of links are almost always spam. */
export function looksLikeSpam(message: string): boolean {
  const links = message.match(/https?:\/\//gi)?.length ?? 0;
  return links > 5;
}
