import { expect, test } from "@playwright/test";

const WIDTHS = [360, 390, 430, 768, 1024, 1280, 1440, 1920];
const PAGES = ["/", "/projects", "/services/workflow-automation", "/sponsorship", "/media-kit", "/contact"];

test("no horizontal overflow at any breakpoint", async ({ page }) => {
  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: 900 });
    for (const url of PAGES) {
      await page.goto(url);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, `${url} @ ${width}px`).toBeLessThanOrEqual(0);
    }
  }
});

test("admin is usable on a phone", async ({ browser }) => {
  const ctx = await browser.newContext({ storageState: ".tmp/auth/owner.json", viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto("/admin/inquiries");
  await page.getByRole("button", { name: "Open admin menu" }).click();
  await page.getByRole("navigation", { name: "Admin" }).getByRole("link", { name: "Projects" }).click();
  await expect(page).toHaveURL(/\/admin\/projects$/);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  await ctx.close();
});
