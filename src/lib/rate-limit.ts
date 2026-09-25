import "server-only";

import { sql } from "drizzle-orm";

import { getDb } from "@/db";

/**
 * Fixed-window rate limit backed by Postgres (works across serverless
 * instances). Returns true when the request is allowed.
 */
export async function rateLimit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  const rows = await getDb().execute<{ c: number }>(sql`select private.rate_limit_hit(${key}, ${windowSeconds}) as c`);
  const count = Number(rows[0]?.c ?? 0);
  return count <= limit;
}
