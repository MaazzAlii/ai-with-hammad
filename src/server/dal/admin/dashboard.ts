import "server-only";

import { count, desc, eq, isNull, sql } from "drizzle-orm";

import { getDb } from "@/db";
import { auditLogs, contactInquiries, contentItems, projects, services, sponsorshipInquiries, teamMembers } from "@/db/schema";

import { mediaStats } from "./media";

/** Real counts only — no synthetic analytics. */
export async function dashboardStats() {
  const db = getDb();
  const pub = (t: typeof projects | typeof services | typeof teamMembers | typeof contentItems) =>
    db
      .select({ published: sql<number>`count(*) filter (where ${t.isPublished})::int`, drafts: sql<number>`count(*) filter (where not ${t.isPublished})::int` })
      .from(t)
      .where(isNull(t.deletedAt));
  const [[p], [s], [tm], [c], contactByStatus, sponsorByStatus, media] = await Promise.all([
    pub(projects),
    pub(services),
    pub(teamMembers),
    pub(contentItems),
    db.select({ status: contactInquiries.status, n: count() }).from(contactInquiries).groupBy(contactInquiries.status),
    db.select({ status: sponsorshipInquiries.status, n: count() }).from(sponsorshipInquiries).groupBy(sponsorshipInquiries.status),
    mediaStats(),
  ]);
  return {
    content: { projects: p!, services: s!, team: tm!, content: c! },
    inquiries: { contact: contactByStatus, sponsorship: sponsorByStatus },
    media,
  };
}

export async function recentInquiries(limit = 6) {
  const db = getDb();
  const [a, b] = await Promise.all([
    db.select({ id: contactInquiries.id, name: contactInquiries.name, company: contactInquiries.company, status: contactInquiries.status, createdAt: contactInquiries.createdAt }).from(contactInquiries).orderBy(desc(contactInquiries.createdAt)).limit(limit),
    db.select({ id: sponsorshipInquiries.id, name: sponsorshipInquiries.name, company: sponsorshipInquiries.company, status: sponsorshipInquiries.status, createdAt: sponsorshipInquiries.createdAt }).from(sponsorshipInquiries).orderBy(desc(sponsorshipInquiries.createdAt)).limit(limit),
  ]);
  return [...a.map((r) => ({ ...r, kind: "contact" as const })), ...b.map((r) => ({ ...r, kind: "sponsorship" as const }))]
    .sort((x, y) => y.createdAt.getTime() - x.createdAt.getTime())
    .slice(0, limit);
}

export async function recentActivity(limit = 8) {
  return getDb()
    .select({ id: auditLogs.id, action: auditLogs.action, summary: auditLogs.summary, actorEmail: auditLogs.actorEmail, createdAt: auditLogs.createdAt })
    .from(auditLogs)
    .where(sql`${auditLogs.action} not like 'auth.%'`)
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit);
}

export const newInquiryFilter = { contact: eq(contactInquiries.status, "new"), sponsorship: eq(sponsorshipInquiries.status, "new") };
