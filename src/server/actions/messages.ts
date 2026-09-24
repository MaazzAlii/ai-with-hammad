"use server";

import { eq } from "drizzle-orm";
import { after } from "next/server";
import { z } from "zod";

import { getDb } from "@/db";
import { clients, messageThreads, messages } from "@/db/schema";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { formDataToObject } from "@/lib/form-data";
import { messageSchema, newThreadSchema } from "@/lib/validation/portal";

import { audit } from "../audit";
import { authorize } from "../auth/session";
import { notifyNewMessage } from "../notify";
import { assertId, runAction } from "../run-action";

type Result = ActionResult<{ id?: string; redirectTo?: string }>;

export async function staffReply(threadId: string, _prev: unknown, fd: FormData): Promise<Result> {
  return runAction(async () => {
    assertId(threadId);
    const staff = await authorize("messages.write");
    const { body } = messageSchema.parse(formDataToObject(fd));
    const db = getDb();
    const [t] = await db
      .select({ id: messageThreads.id, subject: messageThreads.subject, clientId: messageThreads.clientId, companyName: clients.companyName })
      .from(messageThreads)
      .innerJoin(clients, eq(clients.id, messageThreads.clientId))
      .where(eq(messageThreads.id, threadId));
    if (!t) return fail("Conversation not found.");
    const now = new Date();
    await db.transaction(async (tx) => {
      await tx.insert(messages).values({ threadId, authorId: staff.id, authorKind: "staff", body });
      await tx.update(messageThreads).set({ lastMessageAt: now, staffLastReadAt: now }).where(eq(messageThreads.id, threadId));
    });
    await audit(staff, { action: "message.reply", entityType: "message_thread", entityId: threadId, summary: `Replied to ${t.companyName}` });
    after(() => notifyNewMessage({ to: "client", clientId: t.clientId, companyName: t.companyName, subject: t.subject, threadId }).then(() => undefined));
    return ok({ id: threadId }, "Reply sent");
  });
}

export async function startThreadWithClient(clientId: string, _prev: unknown, fd: FormData): Promise<Result> {
  return runAction(async () => {
    assertId(clientId);
    const staff = await authorize("messages.write");
    const input = newThreadSchema.parse(formDataToObject(fd));
    const db = getDb();
    const [c] = await db.select({ id: clients.id, companyName: clients.companyName }).from(clients).where(eq(clients.id, clientId));
    if (!c) return fail("Client not found.");
    const threadId = await db.transaction(async (tx) => {
      const [t] = await tx.insert(messageThreads).values({ clientId, subject: input.subject, createdBy: staff.id, staffLastReadAt: new Date() }).returning({ id: messageThreads.id });
      await tx.insert(messages).values({ threadId: t!.id, authorId: staff.id, authorKind: "staff", body: input.body });
      return t!.id;
    });
    await audit(staff, { action: "message.thread_create", entityType: "message_thread", entityId: threadId, summary: `Started "${input.subject}" with ${c.companyName}` });
    after(() => notifyNewMessage({ to: "client", clientId, companyName: c.companyName, subject: input.subject, threadId }).then(() => undefined));
    return ok({ id: threadId, redirectTo: `/admin/messages/${threadId}` }, "Conversation started");
  });
}

export async function setThreadStatus(threadId: string, status: string): Promise<ActionResult> {
  return runAction(async () => {
    assertId(threadId);
    const s = z.enum(["open", "closed"]).parse(status);
    const staff = await authorize("messages.write");
    const rows = await getDb().update(messageThreads).set({ status: s }).where(eq(messageThreads.id, threadId)).returning({ id: messageThreads.id });
    if (!rows.length) return fail("Conversation not found.");
    await audit(staff, { action: `message.thread_${s === "open" ? "reopen" : "close"}`, entityType: "message_thread", entityId: threadId, summary: `${s === "open" ? "Reopened" : "Closed"} conversation` });
    return ok(undefined, s === "open" ? "Reopened" : "Closed");
  });
}

export async function markThreadReadByStaff(threadId: string): Promise<ActionResult> {
  return runAction(async () => {
    assertId(threadId);
    await authorize("messages.read");
    await getDb().update(messageThreads).set({ staffLastReadAt: new Date() }).where(eq(messageThreads.id, threadId));
    return ok();
  });
}
