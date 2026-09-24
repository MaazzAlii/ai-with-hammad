import "server-only";

import { and, asc, count, desc, eq, ilike, or, type SQL } from "drizzle-orm";

import { getDb } from "@/db";
import { contactInquiries, inquiryNotes, profiles, sponsorshipInquiries, sponsorshipPackages, type InquiryStatus } from "@/db/schema";

export type InquiryKind = "contact" | "sponsorship";
export type InquiryFilters = { kind?: InquiryKind; status?: InquiryStatus; q?: string; assigned?: string; page?: number };

const PAGE = 30;

function escapeLike(s: string) {
  return `%${s.replace(/[%_\\]/g, (m) => `\\${m}`)}%`;
}

export async function listInquiries(f: InquiryFilters) {
  const db = getDb();
  const page = Math.max(1, f.page ?? 1);
  const build = <T extends typeof contactInquiries | typeof sponsorshipInquiries>(t: T) => {
    const conds: (SQL | undefined)[] = [];
    if (f.status) conds.push(eq(t.status, f.status));
    if (f.assigned && /^[0-9a-f-]{36}$/.test(f.assigned)) conds.push(eq(t.assignedTo, f.assigned));
    if (f.q) conds.push(or(ilike(t.name, escapeLike(f.q)), ilike(t.email, escapeLike(f.q)), ilike(t.company, escapeLike(f.q))));
    return and(...conds);
  };
  const cols = <T extends typeof contactInquiries | typeof sponsorshipInquiries>(t: T) => ({
    id: t.id,
    name: t.name,
    email: t.email,
    company: t.company,
    status: t.status,
    priority: t.priority,
    assignedTo: t.assignedTo,
    createdAt: t.createdAt,
    emailStatus: t.emailStatus,
  });
  const [contact, sponsorship] = await Promise.all([
    f.kind === "sponsorship" ? [] : db.select(cols(contactInquiries)).from(contactInquiries).where(build(contactInquiries)).orderBy(desc(contactInquiries.createdAt)).limit(page * PAGE),
    f.kind === "contact" ? [] : db.select(cols(sponsorshipInquiries)).from(sponsorshipInquiries).where(build(sponsorshipInquiries)).orderBy(desc(sponsorshipInquiries.createdAt)).limit(page * PAGE),
  ]);
  const all = [...contact.map((r) => ({ ...r, kind: "contact" as const })), ...sponsorship.map((r) => ({ ...r, kind: "sponsorship" as const }))].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );
  return { items: all.slice((page - 1) * PAGE, page * PAGE), hasMore: all.length > page * PAGE, page };
}

export async function statusCounts() {
  const db = getDb();
  const [a, b] = await Promise.all([
    db.select({ status: contactInquiries.status, n: count() }).from(contactInquiries).groupBy(contactInquiries.status),
    db.select({ status: sponsorshipInquiries.status, n: count() }).from(sponsorshipInquiries).groupBy(sponsorshipInquiries.status),
  ]);
  const map = new Map<string, number>();
  for (const r of [...a, ...b]) map.set(r.status, (map.get(r.status) ?? 0) + r.n);
  return map;
}

export async function getInquiry(kind: InquiryKind, id: string) {
  const db = getDb();
  if (kind === "contact") {
    const [row] = await db.select().from(contactInquiries).where(eq(contactInquiries.id, id));
    if (!row) return null;
    const notes = await notesFor(eq(inquiryNotes.contactInquiryId, id));
    return { kind, row, notes, packageName: null as string | null };
  }
  const [row] = await db.select().from(sponsorshipInquiries).where(eq(sponsorshipInquiries.id, id));
  if (!row) return null;
  const notes = await notesFor(eq(inquiryNotes.sponsorshipInquiryId, id));
  let packageName: string | null = null;
  if (row.packageId) {
    const [p] = await db.select({ name: sponsorshipPackages.name }).from(sponsorshipPackages).where(eq(sponsorshipPackages.id, row.packageId));
    packageName = p?.name ?? null;
  }
  return { kind, row, notes, packageName };
}

async function notesFor(where: SQL) {
  return getDb()
    .select({ id: inquiryNotes.id, body: inquiryNotes.body, createdAt: inquiryNotes.createdAt, authorEmail: profiles.email, authorName: profiles.fullName })
    .from(inquiryNotes)
    .leftJoin(profiles, eq(profiles.id, inquiryNotes.authorId))
    .where(where)
    .orderBy(asc(inquiryNotes.createdAt));
}

export async function assignableStaff() {
  return getDb()
    .select({ id: profiles.id, email: profiles.email, fullName: profiles.fullName })
    .from(profiles)
    .where(eq(profiles.isActive, true))
    .orderBy(asc(profiles.email));
}
