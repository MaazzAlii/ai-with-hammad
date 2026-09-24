import { expect, test } from "@playwright/test";

import { db, newContext } from "./helpers";

const ROUTES = ["/", "/about", "/services", "/projects", "/team", "/content", "/sponsorship", "/media-kit", "/contact", "/privacy-policy", "/terms", "/cookie-policy"];

test.describe("public site", () => {
  for (const route of ROUTES) {
    test(`${route} renders with one h1, landmarks and no overflow at 360px`, async ({ browser }) => {
      const ctx = await newContext(browser);
      const page = await ctx.newPage();
      await page.setViewportSize({ width: 360, height: 800 });
      const res = await page.goto(route);
      expect(res?.status()).toBe(200);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator("main#main")).toBeVisible();
      await expect(page.locator("header").first()).toBeVisible();
      await expect(page.locator("footer")).toBeVisible();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(0);
      await ctx.close();
    });
  }

  test("unknown and draft URLs return 404", async ({ request }) => {
    expect((await request.get("/projects/does-not-exist")).status()).toBe(404);
    expect((await request.get("/team/nobody")).status()).toBe(404);
    expect((await request.get("/no-such-page")).status()).toBe(404);
  });

  test("seeded services render and link to detail pages", async ({ page }) => {
    await page.goto("/services");
    await page.getByRole("link", { name: "Agentic AI Systems" }).click();
    await expect(page).toHaveURL(/\/services\/agentic-ai-systems$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Agentic AI Systems");
    await expect(page.getByText("What's included")).toBeVisible();
  });

  test("mobile navigation opens, traps focus and closes with Escape", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page.getByRole("button", { name: "Open menu" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("link", { name: "Projects" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("contact inquiry is stored in PostgreSQL", async ({ browser }) => {
    const ctx = await newContext(browser);
    const page = await ctx.newPage();
    const email = `lead-${Date.now()}@example.com`;
    await page.goto("/contact");
    await page.getByLabel("Name").fill("Grace Hopper");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Company").fill("Navy Labs");
    await page.getByLabel("Service").selectOption({ label: "Agentic AI Systems" });
    await page.getByLabel("What would you like to build?").fill("An agent that triages our support inbox and drafts replies.");
    await page.waitForTimeout(2600); // minimum fill time (anti-spam)
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(page.getByRole("status").getByText("Message sent")).toBeVisible();
    const sql = db();
    const rows = await sql`select name, company, service_label, status, ip_hash from contact_inquiries where email = ${email}`;
    await sql.end();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ name: "Grace Hopper", company: "Navy Labs", service_label: "Agentic AI Systems", status: "new" });
    expect(rows[0]!.ip_hash).toMatch(/^[0-9a-f]{32}$/);
    await ctx.close();
  });

  test("contact form shows validation errors without submitting", async ({ page }) => {
    await page.goto("/contact");
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(page.getByText("Please enter your name")).toBeVisible();
    await expect(page.getByLabel("Email")).toHaveAttribute("aria-invalid", "true");
  });

  test("honeypot submissions are silently dropped", async ({ browser }) => {
    const ctx = await newContext(browser);
    const page = await ctx.newPage();
    const email = `bot-${Date.now()}@example.com`;
    await page.goto("/contact");
    await page.getByLabel("Name").fill("Bot");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("What would you like to build?").fill("Cheap followers cheap followers cheap followers");
    await page.evaluate(() => ((document.getElementById("contact-hp") as HTMLInputElement).value = "http://spam"));
    await page.waitForTimeout(2600);
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(page.getByRole("status").getByText("Message sent")).toBeVisible();
    const sql = db();
    expect(await sql`select 1 from contact_inquiries where email = ${email}`).toHaveLength(0);
    await sql.end();
    await ctx.close();
  });

  test("sponsorship inquiry is stored and page states rates on request", async ({ browser }) => {
    const ctx = await newContext(browser);
    const page = await ctx.newPage();
    const email = `brand-${Date.now()}@brand.io`;
    await page.goto("/sponsorship");
    await expect(page.getByText("Partnership rates are available upon request.").first()).toBeVisible();
    await page.getByLabel("Name").fill("Brand Manager");
    await page.getByLabel("Work email").fill(email);
    await page.getByLabel("Company / brand").fill("DevTools Inc");
    await page.getByLabel("YouTube").check();
    await page.getByLabel("Tell us about your product").fill("We build a developer tool for AI agents and want a tutorial.");
    await page.waitForTimeout(2600);
    await page.getByRole("button", { name: "Send inquiry" }).click();
    await expect(page.getByText("Inquiry sent")).toBeVisible();
    const sql = db();
    const rows = await sql`select company, platforms from sponsorship_inquiries where email = ${email}`;
    await sql.end();
    expect(rows[0]).toMatchObject({ company: "DevTools Inc", platforms: ["youtube"] });
    await ctx.close();
  });
});
