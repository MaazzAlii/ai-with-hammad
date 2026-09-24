import "dotenv/config";

import { defineConfig } from "drizzle-kit";

/**
 * drizzle-kit configuration.
 *
 * The canonical database setup is supabase/AI_WITH_HAMAD_SETUP.sql (it also
 * holds RLS, triggers, storage policies and seed data). `drizzle/` contains a
 * generated baseline snapshot so future schema changes can be produced with
 * `npm run db:generate` — see docs/SUPABASE_SETUP.md#schema-changes.
 */
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  schemaFilter: ["public"],
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgres://postgres:postgres@127.0.0.1:54322/postgres",
  },
  strict: true,
  verbose: true,
});
