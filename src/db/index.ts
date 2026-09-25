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
export function getDb(): Database {
  if (globalForDb.__aiwhDb) return globalForDb.__aiwhDb;
  const url = serverEnv().databaseUrl;
  if (!url) throw new Error("DATABASE_URL is not configured");
  const client = postgres(url, {
    prepare: false,
    max: process.env.NODE_ENV === "production" ? 5 : 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });
  const db = drizzle(client, { schema });
  globalForDb.__aiwhSql = client;
  globalForDb.__aiwhDb = db;
  return db;
}

export { schema };
