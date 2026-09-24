import { expect, test } from "@playwright/test";

import dotenv from "dotenv";

import { db, expectToast, newContext, PASSWORD, solveCaptcha } from "./helpers";

dotenv.config({ path: ".env.local" });

test("admin changes a user's role and deactivates them (sessions revoked)", async ({ browser }) => {
  const email = `rolechange-${Date.now()}@e2e.test`;
  const key = process.env.SUPABASE_SECRET_KEY!;
  const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, apikey: key, "content-type": "application/json" },
    body: JSON.stringify({ email, password: PASSWORD, email_confirm: true }),
  });
  expect(res.ok).toBe(true);
  const sql = db();
  await sql`update profiles set is_active = true where email = ${email}`;

  // The user signs in as a viewer.
  const userCtx = await newContext(browser);
  const userPage = await userCtx.newPage();
  await userPage.goto("/login");
  await userPage.fill("#email", email);
  await userPage.fill("#password", PASSWORD);
  await solveCaptcha(userPage);
  await userPage.click("button[type=submit]");
  await expect(userPage).toHaveURL(/\/admin$/);

  const adminCtx = await newContext(browser, "admin");
  const page = await adminCtx.newPage();
  await page.goto("/admin/users");
  const row = page.locator("li", { hasText: email });
  await row.locator("summary").click();
  await row.getByLabel("Role").selectOption("editor");
  await row.getByRole("button", { name: "Save" }).click();
  await expectToast(page, "User updated");
  expect((await sql`select role from profiles where email = ${email}`)[0]!.role).toBe("editor");

  await page.reload();
  const row2 = page.locator("li", { hasText: email });
  await row2.locator("summary").click();
  await row2.getByRole("switch", { name: "Active" }).click();
  await row2.getByRole("button", { name: "Save" }).click();
  await expectToast(page, "User updated");
  expect((await sql`select is_active from profiles where email = ${email}`)[0]!.is_active).toBe(false);
  const audit = await sql`select action from audit_logs where summary like ${`%${email}%`}`;
  expect(audit.map((a) => a.action)).toEqual(expect.arrayContaining(["user.role_change", "user.deactivate"]));
  await sql.end();

  // The deactivated user loses access immediately.
  await userPage.goto("/admin/projects");
  await expect(userPage).toHaveURL(/\/login/);
  await userCtx.close();
  await adminCtx.close();
});
