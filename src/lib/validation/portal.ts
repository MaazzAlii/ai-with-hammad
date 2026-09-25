import "@/lib/zod-config";

import { z } from "zod";

export const newThreadSchema = z.object({
  subject: z.string().trim().min(2, "Add a short subject").max(200),
  body: z.string().trim().min(1, "Write a message").max(5000),
});

export const messageSchema = z.object({ body: z.string().trim().min(1, "Write a message").max(5000) });

export const testimonialSubmitSchema = z.object({
  authorName: z.string().trim().min(2, "Your name").max(120),
  authorTitle: z.string().trim().max(120).optional().default(""),
  company: z.string().trim().max(160).optional().default(""),
  quote: z.string().trim().min(20, "Please write at least 20 characters").max(2000),
  rating: z.coerce.number().int().min(1, "Choose a rating").max(5),
  consentToPublish: z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean()),
});

export const manualTestimonialSchema = testimonialSubmitSchema.extend({
  clientId: z.preprocess((v) => (v === "" ? null : v), z.uuid().nullable()).optional().default(null),
  projectId: z.preprocess((v) => (v === "" ? null : v), z.uuid().nullable()).optional().default(null),
  photoMediaId: z.preprocess((v) => (v === "" ? null : v), z.uuid().nullable()).optional().default(null),
});

export const clientSchema = z.object({
  companyName: z.string().trim().min(1, "Required").max(160),
  contactName: z.string().trim().max(120).optional().default(""),
  email: z.union([z.literal(""), z.email()]).optional().default(""),
  phone: z.string().trim().max(40).optional().default(""),
  whatsapp: z.string().trim().max(20).regex(/^(\+?\d{7,15})?$/, "International format, e.g. +923001234567").optional().default(""),
  notes: z.string().trim().max(5000).optional().default(""),
  isActive: z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean()),
});

export const inviteClientUserSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email")),
  fullName: z.string().trim().max(120).optional().default(""),
});

export const faqSchema = z.object({
  question: z.string().trim().min(3).max(300),
  answer: z.string().trim().min(1).max(4000),
  category: z.string().trim().max(60).optional().default(""),
  isPublished: z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean()),
});
