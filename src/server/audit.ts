import "server-only";

import { getDb } from "@/db";
import { auditLogs } from "@/db/schema";

import type { Staff } from "./auth/session";

const SENSITIVE_KEY = /pass(word)?|secret|token|api[_-]?key|authorization|cookie|rate|negotiation/i;

/** Remove anything that looks sensitive before persisting audit metadata. */
export function scrubMetadata(value: unknown, depth = 0): unknown {
  if (depth > 4) return "[truncated]";
  if (Array.isArray(value)) return value.slice(0, 50).map((v) => scrubMetadata(v, depth + 1));
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = SENSITIVE_KEY.test(k) ? "[redacted]" : scrubMetadata(v, depth + 1);
    }
    return out;
  }
  if (typeof value === "string" && value.length > 500) return `${value.slice(0, 500)}…`;
  return value;
}

export type AuditEntry = {
  action: string; // e.g. "project.create", "auth.login"
  entityType?: string;
  entityId?: string | null;
  summary?: string;
  metadata?: Record<string, unknown>;
  ipHash?: string | null;
};

/** Append an audit record. Never throws: auditing must not break the user action. */
export async function audit(actor: Pick<Staff, "id" | "email"> | null, entry: AuditEntry): Promise<void> {
  try {
    await getDb()
      .insert(auditLogs)
      .values({
        actorId: actor?.id ?? null,
        actorEmail: actor?.email ?? "",
        action: entry.action,
        entityType: entry.entityType ?? "",
        entityId: entry.entityId ?? null,
        summary: (entry.summary ?? "").slice(0, 300),
        metadata: (scrubMetadata(entry.metadata ?? {}) as Record<string, unknown>) ?? {},
        ipHash: entry.ipHash ?? null,
      });
  } catch (error) {
    console.error("[audit] failed to write audit log", entry.action, error instanceof Error ? error.message : error);
  }
}
