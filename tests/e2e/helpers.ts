import { expect, type Browser, type BrowserContext, type Page } from "@playwright/test";
import postgres from "postgres";

export const PASSWORD = "E2e-password-123!";
export const USERS = {
  owner: "owner@e2e.test",
  admin: "admin@e2e.test",
  manager: "manager@e2e.test",
  editor: "editor@e2e.test",
  viewer: "viewer@e2e.test",
  inactive: "inactive@e2e.test",
  /** Used by sign-in/sign-out tests (sign-out revokes all of a user's sessions). */
  session: "session@e2e.test",
} as const;
export type RoleName = keyof typeof USERS;

export function db() {
  return postgres(process.env.DATABASE_URL ?? "postgres://postgres@127.0.0.1:54322/aiwh_e2e", { max: 1, onnotice: () => {} });
}

/** Each context gets its own client IP so per-IP rate limits don't interfere between tests. */
export function randomIpHeaders() {
  const o = () => Math.floor(Math.random() * 250) + 1;
  return { "x-forwarded-for": `10.${o()}.${o()}.${o()}` };
}

export async function newContext(browser: Browser, role?: RoleName): Promise<BrowserContext> {
  return browser.newContext({ extraHTTPHeaders: randomIpHeaders(), ...(role ? { storageState: `.tmp/auth/${role}.json` } : {}) });
}

export async function login(page: Page, email: string, password = PASSWORD) {
  await page.goto("/login");
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.click("button[type=submit]");
}

export async function expectToast(page: Page, text: string | RegExp) {
  await expect(page.locator("[data-sonner-toast]").filter({ hasText: text }).first()).toBeVisible();
}

export const uid = () => Math.random().toString(36).slice(2, 8);
