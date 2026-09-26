import "server-only";

import { getDb, isDatabaseConfigured, type Database } from "@/db";

import { withTimeout } from "../../with-timeout";

let warned = false;

const IS_BUILD = process.env.NEXT_PHASE === "phase-production-build";
/** Build: give up quickly and ship the page empty (ISR fills it in). Runtime: fail so ISR keeps the last good page. */
const QUERY_TIMEOUT_MS = IS_BUILD ? 10_000 : 12_000;
/** Build-time circuit breaker: after one failure, stop waiting on the database for the rest of the build. */
let buildDbUnavailable = false;

/**
 * Run a public query, or return `fallback` when no database is configured
 * (e.g. CI builds without secrets). Production requires DATABASE_URL (see
 * src/lib/env.ts), so this never masks a misconfigured production deploy.
 *
 * Every query has a time limit. During `next build` a slow/unreachable database must not
 * fail the deploy (Vercel aborts pages after 60 s), so the page is prerendered with the
 * fallback and regenerated with real data at runtime. At runtime the error is thrown, so
 * ISR keeps serving the previous good version instead of caching an empty page.
 */
export async function withPublicDb<T>(fallback: T, fn: (db: Database) => Promise<T>): Promise<T> {
  if (!isDatabaseConfigured()) {
    if (!warned) {
      console.warn("[dal] DATABASE_URL not set — rendering public pages with empty data.");
      warned = true;
    }
    return fallback;
  }
  if (IS_BUILD && buildDbUnavailable) return fallback;
  try {
    return await withTimeout(fn(getDb()), QUERY_TIMEOUT_MS, "Public query");
  } catch (e) {
    if (IS_BUILD) {
      buildDbUnavailable = true;
      console.warn("[dal] database query failed during build — prerendering with fallback data; ISR will refresh it:", e instanceof Error ? e.message : e);
      return fallback;
    }
    throw e;
  }
}
