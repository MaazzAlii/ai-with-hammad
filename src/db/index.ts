import "server-only";

import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { serverEnv } from "@/lib/env";

import * as schema from "./schema";

export type Database = PostgresJsDatabase<typeof schema>;

type Clients = { sql: postgres.Sql; txSql: postgres.Sql; db: Database };
const globalForDb = globalThis as unknown as { __aiwhDb?: Clients };

/** True when a database connection string is configured. */
export function isDatabaseConfigured(): boolean {
  return Boolean(serverEnv().databaseUrl);
}

/**
 * Connections per process (queries beyond this wait for a free connection). Kept small
 * because Vercel runs many instances. DB_POOL_MAX overrides.
 */
function poolSize(): number {
  const override = Number(process.env.DB_POOL_MAX);
  if (Number.isInteger(override) && override > 0) return override;
  if (process.env.NEXT_PHASE === "phase-production-build") return 2;
  return process.env.NODE_ENV === "production" ? 5 : 10;
}

/**
 * Server-only Drizzle client. Connects as the database owner (bypasses RLS), so every query
 * in src/server/dal must apply its own publication and permission filters.
 *
 * Two postgres.js pools, both with `prepare: false` for the Supabase transaction pooler:
 *
 * - Queries: `max_pipeline: 0` — one query per connection at a time. postgres.js pipelines up
 *   to 100 queries per connection by default, and Supavisor (port 6543) stalls on pipelined
 *   queries, which made every page running queries in parallel hang.
 * - Transactions: `max_pipeline: 0` would stop postgres.js from reserving the connection for
 *   `begin` (its `onexecute` hook never runs), so every transaction failed. Transactions get a
 *   small pool with `max_pipeline: 1`; inside a transaction drizzle awaits each statement, so
 *   nothing is ever pipelined there either.
 *
 * `max_pipeline` is supported at runtime but missing from postgres.js' types, hence the spread.
 */
export function getDb(): Database {
  if (globalForDb.__aiwhDb) return globalForDb.__aiwhDb.db;
  const url = serverEnv().databaseUrl;
  if (!url) throw new Error("DATABASE_URL is not configured");
  const common = {
    prepare: false,
    // Return idle connections quickly: serverless instances and build workers each hold a
    // pool, and Supabase's poolers only allow a limited number of clients in total.
    idle_timeout: 5,
    max_lifetime: 60 * 5,
    connect_timeout: 10,
  };
  const sql = postgres(url, { ...common, ...{ max_pipeline: 0 }, max: poolSize() });
  const txSql = postgres(url, { ...common, ...{ max_pipeline: 1 }, max: Math.min(2, poolSize()) });
  const db = drizzle(sql, { schema });
  const txDb = drizzle(txSql, { schema });
  // Every db.transaction(...) runs on the transaction pool.
  db.transaction = txDb.transaction.bind(txDb) as Database["transaction"];
  globalForDb.__aiwhDb = { sql, txSql, db };
  return db;
}

/**
 * Drop the shared clients after a timeout. A connection stuck waiting on the database's
 * pooler would otherwise wedge every later request on this server instance; the next
 * getDb() call opens fresh pools.
 */
export function resetDb(): void {
  const clients = globalForDb.__aiwhDb;
  globalForDb.__aiwhDb = undefined;
  clients?.sql.end({ timeout: 0 }).catch(() => {});
  clients?.txSql.end({ timeout: 0 }).catch(() => {});
}

export { schema };
