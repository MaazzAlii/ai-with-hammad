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
 * Connections per process. `next build` prerenders pages in several parallel workers and
 * Vercel runs many function instances, so each keeps a tiny pool (queries queue briefly
 * instead of exhausting the database's client limit and hanging). DB_POOL_MAX overrides.
 */
function poolSize(): number {
  const override = Number(process.env.DB_POOL_MAX);
  if (Number.isInteger(override) && override > 0) return override;
  if (process.env.NEXT_PHASE === "phase-production-build") return 1;
  return process.env.NODE_ENV === "production" ? 2 : 10;
}

export function getDb(): Database {
  if (globalForDb.__aiwhDb) return globalForDb.__aiwhDb;
  const url = serverEnv().databaseUrl;
  if (!url) throw new Error("DATABASE_URL is not configured");
  const client = postgres(url, {
    prepare: false,
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

export { schema };
