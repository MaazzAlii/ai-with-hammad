import { execFileSync } from "node:child_process";
import path from "node:path";

import postgres from "postgres";

/**
 * Builds a fresh, isolated test database from the canonical SQL:
 *   bootstrap (Supabase-like roles/storage) → auth stub → setup SQL (twice, to
 *   prove idempotency). Requires a local PostgreSQL server; configure with
 *   TEST_PG_ADMIN_URL (default postgres://postgres@127.0.0.1:54322/postgres).
 */
export default async function setup() {
  const adminUrl = process.env.TEST_PG_ADMIN_URL ?? "postgres://postgres@127.0.0.1:54322/postgres";
  const dbName = "aiwh_test";
  const admin = postgres(adminUrl, { max: 1, onnotice: () => {} });
  await admin.unsafe(`drop database if exists ${dbName} with (force)`);
  await admin.unsafe(`create database ${dbName}`);
  await admin.end();

  const url = new URL(adminUrl);
  url.pathname = `/${dbName}`;
  const testUrl = url.toString();
  const root = path.resolve(__dirname, "../..");
  const run = (file: string) =>
    execFileSync("psql", ["-v", "ON_ERROR_STOP=1", "-q", testUrl, "-f", path.join(root, file)], {
      stdio: ["ignore", "ignore", "pipe"],
      env: { ...process.env, PGOPTIONS: "-c client_min_messages=warning" },
    });
  run("scripts/local/bootstrap.sql");
  run("tests/db/auth-stub.sql");
  run("supabase/AI_WITH_HAMAD_SETUP.sql");
  run("supabase/AI_WITH_HAMAD_SETUP.sql"); // idempotency: second run must succeed
  process.env.TEST_DATABASE_URL = testUrl;
  process.env.DATABASE_URL = testUrl;
}
