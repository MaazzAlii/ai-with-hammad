import "server-only";

import { and, desc, eq, inArray, or } from "drizzle-orm";

import { getDb } from "@/db";
import { auditLogs } from "@/db/schema";

const LOGIN_ACTIONS = ["auth.login", "auth.login_failed", "auth.login_blocked", "auth.mfa_verified", "auth.mfa_failed", "auth.mfa_enrolled", "auth.mfa_removed", "auth.logout"];

export type LoginHistoryRow = { id: string; action: string; summary: string; createdAt: Date };

/** The signed-in staff member's own sign-in activity — never another user's. */
export async function listMyLoginHistory(staffId: string, email: string, limit = 20): Promise<LoginHistoryRow[]> {
  return getDb()
    .select({ id: auditLogs.id, action: auditLogs.action, summary: auditLogs.summary, createdAt: auditLogs.createdAt })
    .from(auditLogs)
    .where(and(inArray(auditLogs.action, LOGIN_ACTIONS), or(eq(auditLogs.actorId, staffId), eq(auditLogs.actorEmail, email))))
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit);
}
