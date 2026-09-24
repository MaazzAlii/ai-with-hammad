import "server-only";

import { and, eq } from "drizzle-orm";

import { getDb } from "@/db";
import { profiles, siteSettings } from "@/db/schema";
import { serverEnv } from "@/lib/env";
import { absoluteUrl } from "@/lib/seo";

import { sendEmailSafely } from "./email";

/** Staff recipients for notifications (env + Settings → Notifications). */
export async function staffRecipients(): Promise<string[]> {
  const env = serverEnv();
  const set = new Set<string>();
  env.inquiryNotificationEmail?.split(",").forEach((e) => e.trim() && set.add(e.trim()));
  const [row] = await getDb().select({ value: siteSettings.value }).from(siteSettings).where(eq(siteSettings.key, "internal.notifications"));
  const list = (row?.value as { inquiryRecipients?: unknown })?.inquiryRecipients;
  if (Array.isArray(list)) for (const e of list) if (typeof e === "string" && /^[^\s@]+@[^\s@]+$/.test(e)) set.add(e);
  return [...set].slice(0, 10);
}

export async function clientRecipients(clientId: string): Promise<string[]> {
  const rows = await getDb()
    .select({ email: profiles.email })
    .from(profiles)
    .where(and(eq(profiles.clientId, clientId), eq(profiles.kind, "client"), eq(profiles.isActive, true)));
  return rows.map((r) => r.email).filter(Boolean).slice(0, 10);
}

/** Notifications never include the message body (it stays in the authenticated portal). */
export async function notifyNewMessage(opts: { to: "staff" | "client"; clientId: string; companyName: string; subject: string; threadId: string }) {
  const to = opts.to === "staff" ? await staffRecipients() : await clientRecipients(opts.clientId);
  const path = opts.to === "staff" ? `/admin/messages/${opts.threadId}` : `/portal/messages/${opts.threadId}`;
  const subject = (opts.to === "staff" ? `New message from ${opts.companyName}: ${opts.subject}` : `New reply: ${opts.subject}`).replace(/[\r\n]+/g, " ").slice(0, 150);
  return sendEmailSafely({ to, subject, text: `You have a new message.\n\nOpen the conversation: ${absoluteUrl(path)}\n` });
}
