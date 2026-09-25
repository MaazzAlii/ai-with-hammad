import { mkdirSync } from "node:fs";

import { chromium, type FullConfig } from "@playwright/test";
import dotenv from "dotenv";

import { db, login, PASSWORD, randomIpHeaders, USERS, type RoleName } from "./helpers";

dotenv.config({ path: ".env.local" });

/** Creates one real GoTrue user per role and stores a signed-in session for each. */
export default async function globalSetup(config: FullConfig) {
  const gateway = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SECRET_KEY!;
  const sql = db();
  for (const [role, email] of Object.entries(USERS) as [RoleName, string][]) {
    const res = await fetch(`${gateway}/auth/v1/admin/users`, {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, apikey: key, "content-type": "application/json" },
      body: JSON.stringify({ email, password: PASSWORD, email_confirm: true, user_metadata: { full_name: `E2E ${role}` } }),
    });
    if (!res.ok && res.status !== 422) throw new Error(`Could not create ${email}: ${res.status} ${await res.text()}`);
    await sql`update profiles set role = ${role === "inactive" || role === "session" ? "admin" : role}::app_role, is_active = ${role !== "inactive"}, full_name = ${`E2E ${role}`} where email = ${email}`;
  }
  await sql.end();

  mkdirSync(".tmp/auth", { recursive: true });
  const baseURL = config.projects[0]!.use.baseURL!;
  const browser = await chromium.launch(process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {});
  for (const role of ["owner", "admin", "manager", "editor", "viewer"] as RoleName[]) {
    const context = await browser.newContext({ baseURL, extraHTTPHeaders: randomIpHeaders() });
    const page = await context.newPage();
    await login(page, USERS[role]);
    await page.waitForURL("**/admin");
    await context.storageState({ path: `.tmp/auth/${role}.json` });
    await context.close();
  }
  await browser.close();
}
