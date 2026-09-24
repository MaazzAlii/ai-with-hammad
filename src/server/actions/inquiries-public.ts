"use server";

import { and, eq, inArray } from "drizzle-orm";
import { after } from "next/server";

import { getDb, isDatabaseConfigured } from "@/db";
import { contactInquiries, services, siteSettings, sponsorshipInquiries, sponsorshipPackages } from "@/db/schema";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { serverEnv } from "@/lib/env";
import { rateLimit } from "@/lib/rate-limit";
import {
  antiSpamSchema,
  contactInquirySchema,
  looksLikeSpam,
  MIN_FILL_MS,
  sponsorshipInquirySchema,
} from "@/lib/validation/inquiry";

import { audit } from "../audit";
import { sendEmailSafely } from "../email";
import { inquiryNotification } from "../email/templates";
import { CAPTCHA_ERROR, verifyCaptcha, type CaptchaInput } from "../captcha";
import { clientIp, requestMeta } from "../request-meta";
import { runAction } from "../run-action";
import { isPublic } from "../dal/public/filters";

type SpamCheck = { reject: false } | { reject: true; silent: boolean; message?: string };

function checkSpam(raw: unknown): SpamCheck {
  const parsed = antiSpamSchema.safeParse(raw);
  if (!parsed.success) return { reject: true, silent: true }; // honeypot filled
  const started = parsed.data.started_at;
  if (started && Date.now() - started < MIN_FILL_MS) {
    return { reject: true, silent: false, message: "That was quick! Please take a moment and submit again." };
  }
  return { reject: false };
}

async function notificationRecipients(): Promise<string[]> {
  const env = serverEnv();
  const set = new Set<string>();
  if (env.inquiryNotificationEmail) env.inquiryNotificationEmail.split(",").forEach((e) => e.trim() && set.add(e.trim()));
  const [row] = await getDb().select({ value: siteSettings.value }).from(siteSettings).where(eq(siteSettings.key, "internal.notifications"));
  const list = (row?.value as { inquiryRecipients?: unknown })?.inquiryRecipients;
  if (Array.isArray(list)) for (const e of list) if (typeof e === "string" && /^[^\s@]+@[^\s@]+$/.test(e)) set.add(e);
  return [...set].slice(0, 10);
}

async function guard(kind: string, email: string, ipHash: string): Promise<string | null> {
  const [ipOk, emailOk] = await Promise.all([
    rateLimit(`${kind}:ip:${ipHash}`, 5, 600),
    rateLimit(`${kind}:email:${email}`, 3, 3600),
  ]);
  return ipOk && emailOk ? null : "Too many submissions. Please try again later or email us directly.";
}

export async function submitContactInquiry(raw: unknown): Promise<ActionResult<{ id: string }>> {
  return runAction(async () => {
    if (!isDatabaseConfigured()) return fail("The contact form is temporarily unavailable. Please email us instead.");
    const spam = checkSpam(raw);
    if (spam.reject) return spam.silent ? ok(undefined, "Thanks — we'll be in touch.") : fail(spam.message!);
    if (!(await verifyCaptcha(raw as CaptchaInput, await clientIp()))) return fail(CAPTCHA_ERROR, { captchaAnswer: [CAPTCHA_ERROR] });
    const input = contactInquirySchema.parse(raw);
    if (looksLikeSpam(input.message)) return ok(undefined, "Thanks — we'll be in touch.");
    const meta = await requestMeta();
    const limited = await guard("contact", input.email, meta.ipHash);
    if (limited) return fail(limited);

    const db = getDb();
    let serviceLabel = "";
    let serviceId: string | null = null;
    if (input.serviceId) {
      const [svc] = await db.select({ id: services.id, title: services.title }).from(services).where(isPublic(services, eq(services.id, input.serviceId)));
      if (svc) {
        serviceId = svc.id;
        serviceLabel = svc.title;
      }
    }
    // 1) Store first — email problems can never lose the inquiry.
    const [row] = await db
      .insert(contactInquiries)
      .values({
        name: input.name,
        email: input.email,
        company: input.company,
        phone: input.phone,
        serviceId,
        serviceLabel,
        budget: input.budget,
        timeline: input.timeline,
        message: input.message,
        sourcePath: "/contact",
        ipHash: meta.ipHash,
        userAgent: meta.userAgent,
      })
      .returning({ id: contactInquiries.id });
    const id = row!.id;
    await audit(null, { action: "inquiry.received", entityType: "contact_inquiry", entityId: id, summary: "Contact inquiry received", ipHash: meta.ipHash });

    // 2) Notify after the response is sent.
    after(async () => {
      const mail = inquiryNotification(
        "contact",
        { Name: input.name, Email: input.email, Company: input.company, Phone: input.phone, Service: serviceLabel, Budget: input.budget, Timeline: input.timeline, Message: input.message },
        `/admin/inquiries/contact/${id}`,
      );
      const result = await sendEmailSafely({ to: await notificationRecipients(), subject: mail.subject, text: mail.text, replyTo: input.email });
      await getDb().update(contactInquiries).set({ emailStatus: result.status }).where(eq(contactInquiries.id, id));
    });

    return ok({ id }, "Thanks — your message has been received. We'll reply by email.");
  });
}

export async function submitSponsorshipInquiry(raw: unknown): Promise<ActionResult<{ id: string }>> {
  return runAction(async () => {
    if (!isDatabaseConfigured()) return fail("The form is temporarily unavailable. Please email us instead.");
    const spam = checkSpam(raw);
    if (spam.reject) return spam.silent ? ok(undefined, "Thanks — we'll be in touch.") : fail(spam.message!);
    if (!(await verifyCaptcha(raw as CaptchaInput, await clientIp()))) return fail(CAPTCHA_ERROR, { captchaAnswer: [CAPTCHA_ERROR] });
    const input = sponsorshipInquirySchema.parse(raw);
    if (looksLikeSpam(input.message)) return ok(undefined, "Thanks — we'll be in touch.");
    const meta = await requestMeta();
    const limited = await guard("sponsorship", input.email, meta.ipHash);
    if (limited) return fail(limited);

    const db = getDb();
    let packageId: string | null = null;
    let packageName = "";
    if (input.packageId) {
      const [pkg] = await db
        .select({ id: sponsorshipPackages.id, name: sponsorshipPackages.name })
        .from(sponsorshipPackages)
        .where(and(isPublic(sponsorshipPackages), inArray(sponsorshipPackages.id, [input.packageId])));
      if (pkg) {
        packageId = pkg.id;
        packageName = pkg.name;
      }
    }
    const [row] = await db
      .insert(sponsorshipInquiries)
      .values({
        name: input.name,
        email: input.email,
        company: input.company,
        website: input.website,
        packageId,
        platforms: input.platforms,
        budgetRange: input.budgetRange,
        timeline: input.timeline,
        campaignGoals: input.campaignGoals,
        message: input.message,
        sourcePath: "/sponsorship",
        ipHash: meta.ipHash,
        userAgent: meta.userAgent,
      })
      .returning({ id: sponsorshipInquiries.id });
    const id = row!.id;
    await audit(null, { action: "inquiry.received", entityType: "sponsorship_inquiry", entityId: id, summary: "Sponsorship inquiry received", ipHash: meta.ipHash });

    after(async () => {
      const mail = inquiryNotification(
        "sponsorship",
        { Name: input.name, Email: input.email, Company: input.company, Website: input.website, Package: packageName, Platforms: input.platforms.join(", "), Budget: input.budgetRange, Timeline: input.timeline, Goals: input.campaignGoals, Message: input.message },
        `/admin/inquiries/sponsorship/${id}`,
      );
      const result = await sendEmailSafely({ to: await notificationRecipients(), subject: mail.subject, text: mail.text, replyTo: input.email });
      await getDb().update(sponsorshipInquiries).set({ emailStatus: result.status }).where(eq(sponsorshipInquiries.id, id));
    });

    return ok({ id }, "Thanks — your partnership inquiry has been received. We'll reply by email.");
  });
}
