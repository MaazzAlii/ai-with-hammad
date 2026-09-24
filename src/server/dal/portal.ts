import "server-only";

import { and, asc, count, desc, eq, isNull, sql } from "drizzle-orm";

import { getDb } from "@/db";
import { clients, messageThreads, messages, profiles, testimonials } from "@/db/schema";

/** Threads for one client (portal) with unread flag for the client. */
export async function listClientThreads(clientId: string) {
  return getDb()
    .select({
      id: messageThreads.id,
      subject: messageThreads.subject,
      status: messageThreads.status,
      lastMessageAt: messageThreads.lastMessageAt,
      unread: sql<boolean>`(${messageThreads.clientLastReadAt} is null or ${messageThreads.clientLastReadAt} < ${messageThreads.lastMessageAt})
        and exists (select 1 from ${messages} m where m.thread_id = ${messageThreads.id} and m.author_kind = 'staff' and m.created_at > coalesce(${messageThreads.clientLastReadAt}, 'epoch'))`,
    })
    .from(messageThreads)
    .where(eq(messageThreads.clientId, clientId))
    .orderBy(desc(messageThreads.lastMessageAt));
}

/** Thread + messages, only if it belongs to `clientId` (or any client when clientId is null = staff). */
export async function getThread(threadId: string, clientId: string | null) {
  const db = getDb();
  const [thread] = await db
    .select({
      id: messageThreads.id,
      subject: messageThreads.subject,
      status: messageThreads.status,
      clientId: messageThreads.clientId,
      companyName: clients.companyName,
      createdAt: messageThreads.createdAt,
      staffLastReadAt: messageThreads.staffLastReadAt,
    })
    .from(messageThreads)
    .innerJoin(clients, eq(clients.id, messageThreads.clientId))
    .where(clientId ? and(eq(messageThreads.id, threadId), eq(messageThreads.clientId, clientId)) : eq(messageThreads.id, threadId));
  if (!thread) return null;
  const rows = await db
    .select({ id: messages.id, body: messages.body, authorKind: messages.authorKind, createdAt: messages.createdAt, authorName: profiles.fullName, authorEmail: profiles.email })
    .from(messages)
    .leftJoin(profiles, eq(profiles.id, messages.authorId))
    .where(eq(messages.threadId, threadId))
    .orderBy(asc(messages.createdAt));
  return { thread, messages: rows };
}

/** Staff inbox: every thread with client name, last message preview and unread flag for staff. */
export async function listInboxThreads(filter: { status?: "open" | "closed"; clientId?: string; unreadOnly?: boolean } = {}) {
  const unread = sql<boolean>`exists (select 1 from ${messages} m where m.thread_id = ${messageThreads.id} and m.author_kind = 'client' and m.created_at > coalesce(${messageThreads.staffLastReadAt}, 'epoch'))`;
  const conds = [
    filter.status ? eq(messageThreads.status, filter.status) : undefined,
    filter.clientId ? eq(messageThreads.clientId, filter.clientId) : undefined,
    filter.unreadOnly ? unread : undefined,
  ];
  return getDb()
    .select({
      id: messageThreads.id,
      subject: messageThreads.subject,
      status: messageThreads.status,
      lastMessageAt: messageThreads.lastMessageAt,
      clientId: clients.id,
      companyName: clients.companyName,
      unread,
      preview: sql<string>`(select left(m.body, 140) from ${messages} m where m.thread_id = ${messageThreads.id} order by m.created_at desc limit 1)`,
    })
    .from(messageThreads)
    .innerJoin(clients, eq(clients.id, messageThreads.clientId))
    .where(and(...conds))
    .orderBy(desc(messageThreads.lastMessageAt))
    .limit(200);
}

export async function unreadThreadCount() {
  const [r] = await getDb()
    .select({ n: count() })
    .from(messageThreads)
    .where(
      sql`exists (select 1 from ${messages} m where m.thread_id = ${messageThreads.id} and m.author_kind = 'client' and m.created_at > coalesce(${messageThreads.staffLastReadAt}, 'epoch'))`,
    );
  return r?.n ?? 0;
}

export async function listClientTestimonials(clientId: string) {
  return getDb()
    .select({ id: testimonials.id, quote: testimonials.quote, rating: testimonials.rating, status: testimonials.status, isPublished: testimonials.isPublished, createdAt: testimonials.createdAt })
    .from(testimonials)
    .where(and(eq(testimonials.clientId, clientId), isNull(testimonials.deletedAt)))
    .orderBy(desc(testimonials.createdAt));
}

export async function listClientsAdmin() {
  return getDb()
    .select({
      id: clients.id,
      companyName: clients.companyName,
      contactName: clients.contactName,
      email: clients.email,
      isActive: clients.isActive,
      users: sql<number>`(select count(*)::int from ${profiles} p where p.client_id = ${clients.id} and p.kind = 'client')`,
      openThreads: sql<number>`(select count(*)::int from ${messageThreads} t where t.client_id = ${clients.id} and t.status = 'open')`,
    })
    .from(clients)
    .orderBy(desc(clients.isActive), asc(clients.companyName));
}

export async function getClientAdmin(id: string) {
  const db = getDb();
  const [client] = await db.select().from(clients).where(eq(clients.id, id));
  if (!client) return null;
  const users = await db
    .select({ id: profiles.id, email: profiles.email, fullName: profiles.fullName, isActive: profiles.isActive, lastSignInAt: profiles.lastSignInAt })
    .from(profiles)
    .where(and(eq(profiles.clientId, id), eq(profiles.kind, "client")))
    .orderBy(asc(profiles.email));
  return { client, users };
}

export async function clientOptions() {
  return getDb().select({ id: clients.id, name: clients.companyName }).from(clients).orderBy(asc(clients.companyName));
}

/** Messages newer than the last time staff read, for highlighting. */
export function isNewForStaff(createdAt: Date, lastRead: Date | null) {
  return !lastRead || createdAt > lastRead;
}

