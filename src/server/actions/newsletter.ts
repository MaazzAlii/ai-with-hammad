"use server";

import { eq } from "drizzle-orm";

import { getDb, isDatabaseConfigured } from "@/db";
import { newsletterSubscribers } from "@/db/schema";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { rateLimit } from "@/lib/rate-limit";
import { antiSpamSchema, MIN_FILL_MS } from "@/lib/validation/inquiry";
import { newsletterSignupSchema } from "@/lib/validation/newsletter";

import { audit } from "../audit";
import { authorize } from "../auth/session";
import { CAPTCHA_ERROR, verifyCaptcha, type CaptchaInput } from "../captcha";
import { clientIp, requestMeta } from "../request-meta";
import { assertId, runAction } from "../run-action";

export async function subscribeNewsletter(raw: unknown): Promise<ActionResult> {
  return runAction(async () => {
    if (!isDatabaseConfigured()) return fail("Newsletter signup is temporarily unavailable.");
    const spam = antiSpamSchema.safeParse(raw);
    if (!spam.success) return ok(undefined, "Thanks — you're on the list."); // honeypot filled, fail silently
    if (spam.data.started_at && Date.now() - spam.data.started_at < MIN_FILL_MS) {
      return fail("That was quick! Please take a moment and submit again.");
    }
    if (!(await verifyCaptcha(raw as CaptchaInput, await clientIp()))) return fail(CAPTCHA_ERROR, { captchaAnswer: [CAPTCHA_ERROR] });
    const input = newsletterSignupSchema.parse(raw);
    const meta = await requestMeta();
    if (!(await rateLimit(`newsletter:ip:${meta.ipHash}`, 5, 600))) return fail("Too many attempts. Please try again later.");

    const db = getDb();
    const existing = await db.select({ id: newsletterSubscribers.id }).from(newsletterSubscribers).where(eq(newsletterSubscribers.email, input.email)).limit(1);
    if (existing.length) return ok(undefined, "You're already subscribed — thanks!");
    await db.insert(newsletterSubscribers).values({ email: input.email, sourcePath: "/", ipHash: meta.ipHash });
    await audit(null, { action: "newsletter.subscribe", entityType: "newsletter_subscriber", entityId: input.email, summary: "Newsletter signup", ipHash: meta.ipHash });
    return ok(undefined, "Thanks — you're on the list.");
  });
}

export async function deleteNewsletterSubscriber(id: string): Promise<ActionResult> {
  return runAction(async () => {
    assertId(id);
    const staff = await authorize("newsletter.manage");
    const db = getDb();
    const rows = await db.delete(newsletterSubscribers).where(eq(newsletterSubscribers.id, id)).returning({ id: newsletterSubscribers.id });
    if (!rows.length) return fail("Subscriber not found.");
    await audit(staff, { action: "newsletter.delete", entityType: "newsletter_subscriber", entityId: id, summary: "Removed newsletter subscriber" });
    return ok(undefined, "Removed");
  });
}
