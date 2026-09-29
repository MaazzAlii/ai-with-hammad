import "server-only";

import { desc, isNull } from "drizzle-orm";

import { getDb } from "@/db";
import { newsletterSubscribers } from "@/db/schema";

export type NewsletterSubscriberRow = { id: string; email: string; sourcePath: string; createdAt: Date };

/** Caller must already have checked `newsletter.manage` (e.g. via requirePagePermission in the page). */
export async function listNewsletterSubscribers(): Promise<NewsletterSubscriberRow[]> {
  return getDb()
    .select({ id: newsletterSubscribers.id, email: newsletterSubscribers.email, sourcePath: newsletterSubscribers.sourcePath, createdAt: newsletterSubscribers.createdAt })
    .from(newsletterSubscribers)
    .where(isNull(newsletterSubscribers.unsubscribedAt))
    .orderBy(desc(newsletterSubscribers.createdAt));
}
