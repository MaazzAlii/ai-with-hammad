import "server-only";

import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { serverEnv } from "@/lib/env";

import * as schema from "./schema";

export type Database = PostgresJsDatabase<typeof schema>;

const globalForDb = globalThis as unknown as { __aiwhSql?: postgres.Sql; __aiwhDb?: Database };

/** True when a database connection string is configured. */
export function isDatabaseConfigured(): boolean {
  return Boolean(serverEnv().databaseUrl);
}

/**
 * Server-only Drizzle client. Connects as the database owner (bypasses RLS),
 * so every query in src/server/dal must apply its own publication and
 * permission filters.
 *
 * `prepare: false` keeps it compatible with the Supabase transaction pooler.
 */
/**
 * Connections per process (queries beyond this wait for a free connection — never
 * pipelined). Kept small because Vercel runs many instances. DB_POOL_MAX overrides.
 */
function poolSize(): number {
  const override = Number(process.env.DB_POOL_MAX);
  if (Number.isInteger(override) && override > 0) return override;
  if (process.env.NEXT_PHASE === "phase-production-build") return 2;
  return process.env.NODE_ENV === "production" ? 5 : 10;
}

/**
 * One query per connection at a time. postgres.js pipelines up to 100 queries on a
 * connection by default (`max_pipeline`, supported at runtime but missing from its types);
 * Supabase's transaction pooler (Supavisor, port 6543) stalls on pipelined queries, which
 * made every page running queries in parallel hang.
 */
const NO_PIPELINING = { max_pipeline: 0 };

export function getDb(): Database {
  if (globalForDb.__aiwhDb) return globalForDb.__aiwhDb;
  const url = serverEnv().databaseUrl;
  if (!url) throw new Error("DATABASE_URL is not configured");
  const client = postgres(url, {
    prepare: false,
    ...NO_PIPELINING,
    max: poolSize(),
    // Return idle connections quickly: serverless instances and build workers each hold a
    // pool, and Supabase's poolers only allow a limited number of clients in total.
    idle_timeout: 5,
    max_lifetime: 60 * 5,
    connect_timeout: 10,
  });
  const db = drizzle(client, { schema });
  globalForDb.__aiwhSql = client;
  globalForDb.__aiwhDb = db;
  return db;
}

/**
 * Drop the shared client after a timeout. A connection stuck waiting on the database's
 * pooler would otherwise wedge every later request on this server instance; the next
 * getDb() call opens a fresh pool.
 */
export function resetDb(): void {
  const client = globalForDb.__aiwhSql;
  globalForDb.__aiwhSql = undefined;
  globalForDb.__aiwhDb = undefined;
  client?.end({ timeout: 0 }).catch(() => {});
}

export { schema };
