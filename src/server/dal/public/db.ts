import "server-only";

import { getDb, isDatabaseConfigured, type Database } from "@/db";

let warned = false;

/**
 * Run a public query, or return `fallback` when no database is configured
 * (e.g. CI builds without secrets). Production requires DATABASE_URL (see
 * src/lib/env.ts), so this never masks a misconfigured production deploy.
 */
export async function withPublicDb<T>(fallback: T, fn: (db: Database) => Promise<T>): Promise<T> {
  if (!isDatabaseConfigured()) {
    if (!warned) {
      console.warn("[dal] DATABASE_URL not set — rendering public pages with empty data.");
      warned = true;
    }
    return fallback;
  }
  return fn(getDb());
}
