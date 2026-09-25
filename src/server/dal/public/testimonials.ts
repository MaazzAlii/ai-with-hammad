import "server-only";

import { and, asc, desc, eq, isNull } from "drizzle-orm";
import { cache } from "react";

import { faqs, testimonials } from "@/db/schema";

import { withPublicDb } from "./db";
import { loadPublicMedia, type MediaDTO } from "./media";

export type TestimonialDTO = {
  id: string;
  authorName: string;
  authorTitle: string;
  company: string;
  quote: string;
  rating: number;
  isFeatured: boolean;
  photo: MediaDTO | null;
};

/** Only approved + consented + published testimonials (the DB constraint guarantees the combination). */
export const listPublishedTestimonials = cache(async (opts: { featuredOnly?: boolean; limit?: number } = {}): Promise<TestimonialDTO[]> =>
  withPublicDb([], async (db) => {
    const q = db
      .select({
        id: testimonials.id,
        authorName: testimonials.authorName,
        authorTitle: testimonials.authorTitle,
        company: testimonials.company,
        quote: testimonials.quote,
        rating: testimonials.rating,
        isFeatured: testimonials.isFeatured,
        photoMediaId: testimonials.photoMediaId,
      })
      .from(testimonials)
      .where(
        and(
          eq(testimonials.isPublished, true),
          eq(testimonials.status, "approved"),
          eq(testimonials.consentToPublish, true),
          isNull(testimonials.deletedAt),
          opts.featuredOnly ? eq(testimonials.isFeatured, true) : undefined,
        ),
      )
      .orderBy(desc(testimonials.isFeatured), asc(testimonials.sortOrder), desc(testimonials.publishedAt));
    const rows = opts.limit ? await q.limit(opts.limit) : await q;
    const media = await loadPublicMedia(db, rows.map((r) => r.photoMediaId));
    return rows.map(({ photoMediaId, ...r }) => ({ ...r, photo: photoMediaId ? (media.get(photoMediaId) ?? null) : null }));
  }),
);

export function averageRating(items: { rating: number }[]) {
  if (!items.length) return null;
  return Math.round((items.reduce((n, t) => n + t.rating, 0) / items.length) * 10) / 10;
}

export type FaqDTO = { id: string; question: string; answer: string; category: string };

export const listPublishedFaqs = cache(async (): Promise<FaqDTO[]> =>
  withPublicDb([], (db) =>
    db
      .select({ id: faqs.id, question: faqs.question, answer: faqs.answer, category: faqs.category })
      .from(faqs)
      .where(and(eq(faqs.isPublished, true), isNull(faqs.deletedAt)))
      .orderBy(asc(faqs.sortOrder)),
  ),
);
