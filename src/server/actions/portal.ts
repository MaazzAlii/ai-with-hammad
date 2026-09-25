"use server";

import { and, eq } from "drizzle-orm";
import { after } from "next/server";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getDb } from "@/db";
import { messageThreads, messages, profiles, testimonials } from "@/db/schema";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { formDataToObject } from "@/lib/form-data";
import { rateLimit } from "@/lib/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { messageSchema, newThreadSchema, testimonialSubmitSchema } from "@/lib/validation/portal";

import { audit } from "../audit";
import { authorizeClient } from "../auth/client-session";
import { CAPTCHA_ERROR, verifyCaptcha } from "../captcha";
import { notifyNewMessage } from "../notify";
import { clientIp, requestMeta } from "../request-meta";
import { assertId, runAction } from "../run-action";

type Result = ActionResult<{ id?: string; redirectTo?: string }>;

const signInSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email")),
  password: z.string().min(1, "Enter your password").max(200),
});

export async function clientSignIn(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = signInSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return fail("Please check the form.", z.flattenError(parsed.error).fieldErrors);
  if (!(await verifyCaptcha(Object.fromEntries(formData), await clientIp()))) return fail(CAPTCHA_ERROR, { captchaAnswer: [CAPTCHA_ERROR] });
  const meta = await requestMeta();
  if (!(await rateLimit(`portal-login:ip:${meta.ipHash}`, 10, 600)) || !(await rateLimit(`portal-login:email:${parsed.data.email}`, 8, 900))) {
    return fail("Too many sign-in attempts. Please wait a few minutes and try again.");
  }
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error || !data.user) return fail("Incorrect email or password.");
  const [p] = await getDb().select({ kind: profiles.kind, isActive: profiles.isActive, clientId: profiles.clientId }).from(profiles).where(eq(profiles.id, data.user.id));
  if (p?.kind !== "client" || !p.isActive || !p.clientId) {
    await supabase.auth.signOut({ scope: "local" });
    return fail(p?.kind === "staff" ? "Team members sign in at /login." : "Your client account is not active. Please contact us.");
  }
  await getDb().update(profiles).set({ lastSignInAt: new Date() }).where(eq(profiles.id, data.user.id));
  await audit({ id: data.user.id, email: parsed.data.email }, { action: "auth.client_login", entityType: "auth", summary: "Client signed in", ipHash: meta.ipHash });
  redirect("/portal");
}

async function ownThread(threadId: string, clientId: string) {
  const [t] = await getDb()
    .select({ id: messageThreads.id, subject: messageThreads.subject, status: messageThreads.status })
    .from(messageThreads)
    .where(and(eq(messageThreads.id, threadId), eq(messageThreads.clientId, clientId)));
  return t ?? null;
}

export async function createClientThread(_prev: unknown, fd: FormData): Promise<Result> {
  return runAction(async () => {
    const user = await authorizeClient();
    const input = newThreadSchema.parse(formDataToObject(fd));
    if (!(await rateLimit(`portal-thread:${user.id}`, 10, 3600))) return fail("You have started many conversations recently. Please continue in an existing one.");
    const db = getDb();
    const threadId = await db.transaction(async (tx) => {
      const [t] = await tx.insert(messageThreads).values({ clientId: user.clientId, subject: input.subject, createdBy: user.id, clientLastReadAt: new Date() }).returning({ id: messageThreads.id });
      await tx.insert(messages).values({ threadId: t!.id, authorId: user.id, authorKind: "client", body: input.body });
      return t!.id;
    });
    await audit(user, { action: "portal.thread_create", entityType: "message_thread", entityId: threadId, summary: `Client started "${input.subject}"` });
    after(() => notifyNewMessage({ to: "staff", clientId: user.clientId, companyName: user.companyName, subject: input.subject, threadId }).then(() => undefined));
    return ok({ id: threadId, redirectTo: `/portal/messages/${threadId}` }, "Message sent");
  });
}

export async function sendClientMessage(threadId: string, _prev: unknown, fd: FormData): Promise<Result> {
  return runAction(async () => {
    assertId(threadId);
    const user = await authorizeClient();
    const thread = await ownThread(threadId, user.clientId);
    if (!thread) return fail("Conversation not found.");
    const { body } = messageSchema.parse(formDataToObject(fd));
    if (!(await rateLimit(`portal-msg:${user.id}`, 60, 3600))) return fail("Too many messages — please wait a moment.");
    const now = new Date();
    await getDb().transaction(async (tx) => {
      await tx.insert(messages).values({ threadId, authorId: user.id, authorKind: "client", body });
      await tx.update(messageThreads).set({ lastMessageAt: now, clientLastReadAt: now, status: "open" }).where(eq(messageThreads.id, threadId));
    });
    after(() => notifyNewMessage({ to: "staff", clientId: user.clientId, companyName: user.companyName, subject: thread.subject, threadId }).then(() => undefined));
    return ok({ id: threadId }, "Sent");
  });
}

export async function markClientThreadRead(threadId: string): Promise<ActionResult> {
  return runAction(async () => {
    assertId(threadId);
    const user = await authorizeClient();
    await getDb().update(messageThreads).set({ clientLastReadAt: new Date() }).where(and(eq(messageThreads.id, threadId), eq(messageThreads.clientId, user.clientId)));
    return ok();
  });
}

export async function submitTestimonial(_prev: unknown, fd: FormData): Promise<Result> {
  return runAction(async () => {
    const user = await authorizeClient();
    const input = testimonialSubmitSchema.parse(formDataToObject(fd));
    if (!(await rateLimit(`portal-testimonial:${user.id}`, 5, 86400))) return fail("You have submitted several testimonials today — thank you! Please try again tomorrow.");
    const [row] = await getDb()
      .insert(testimonials)
      .values({ ...input, clientId: user.clientId, submittedBy: user.id, source: "portal", status: "pending", isPublished: false })
      .returning({ id: testimonials.id });
    await audit(user, { action: "testimonial.submit", entityType: "testimonial", entityId: row!.id, summary: `Client testimonial (${input.rating}★)` });
    return ok({ id: row!.id }, "Thank you! Your feedback was sent to the team for review.");
  });
}
