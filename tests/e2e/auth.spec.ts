import { expect, test } from "@playwright/test";

import { login, newContext, solveCaptcha, USERS } from "./helpers";

test.describe("authentication", () => {
  test("anonymous visitors are redirected from /admin to /login", async ({ browser }) => {
    const ctx = await newContext(browser);
    const page = await ctx.newPage();
    await page.goto("/admin/projects");
    await expect(page).toHaveURL(/\/login\?next=%2Fadmin%2Fprojects/);
    await expect(page.getByRole("heading", { name: "Staff sign in" })).toBeVisible();
    // No public signup anywhere.
    await expect(page.getByText(/sign up|create account|register/i)).toHaveCount(0);
    await ctx.close();
  });

  test("wrong password shows a generic error", async ({ browser }) => {
    const ctx = await newContext(browser);
    const page = await ctx.newPage();
    await login(page, USERS.editor, "wrong-password");
    await expect(page.getByText("Incorrect email or password.")).toBeVisible();
    await login(page, "nobody@e2e.test", "whatever-123");
    await expect(page.getByText("Incorrect email or password.")).toBeVisible();
    await ctx.close();
  });

  test("inactive accounts cannot sign in", async ({ browser }) => {
    const ctx = await newContext(browser);
    const page = await ctx.newPage();
    await login(page, USERS.inactive);
    await expect(page.getByText("Your account is not active.")).toBeVisible();
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login/);
    await ctx.close();
  });

  test("sign in honours ?next and sign out ends the session", async ({ browser }) => {
    const ctx = await newContext(browser);
    const page = await ctx.newPage();
    await page.goto("/login?next=/admin/media");
    await page.fill("#email", USERS.session);
    await page.fill("#password", "E2e-password-123!");
    await solveCaptcha(page);
    await page.click("button[type=submit]");
    await expect(page).toHaveURL(/\/admin\/media$/);
    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/login$/);
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login/);
    await ctx.close();
  });

  test("open redirects via ?next are blocked", async ({ browser }) => {
    const ctx = await newContext(browser);
    const page = await ctx.newPage();
    await page.goto("/login?next=https://evil.example");
    await page.fill("#email", USERS.session);
    await page.fill("#password", "E2e-password-123!");
    await solveCaptcha(page);
    await page.click("button[type=submit]");
    await expect(page).toHaveURL(/localhost:3000\/admin$/);
    await ctx.close();
  });

  test("sign-out rejects cross-origin POSTs", async ({ request }) => {
    const res = await request.post("/auth/signout", { headers: { origin: "https://evil.example" }, maxRedirects: 0 });
    expect(res.status()).toBe(403);
  });
});
