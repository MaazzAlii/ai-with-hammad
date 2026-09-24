import { expect, test } from "@playwright/test";

/** Lightweight, dependency-free accessibility checks (axe-core not available offline). */
test("public pages: images have alt, form fields have labels, skip link works", async ({ page }) => {
  for (const url of ["/", "/contact", "/sponsorship", "/projects"]) {
    await page.goto(url);
    const missingAlt = await page.locator("img:not([alt])").count();
    expect(missingAlt, `${url} img without alt`).toBe(0);
    const unlabeled = await page.evaluate(() =>
      [...document.querySelectorAll("input:not([type=hidden]), select, textarea")].filter((el) => {
        const id = el.getAttribute("id");
        const aria = el.getAttribute("aria-label") || el.getAttribute("aria-labelledby");
        const wrapped = el.closest("label");
        const hidden = el.closest("[aria-hidden=true]");
        return !hidden && !aria && !wrapped && !(id && document.querySelector(`label[for="${id}"]`));
      }).length,
    );
    expect(unlabeled, `${url} unlabeled controls`).toBe(0);
    const buttonsWithoutName = await page.evaluate(() => [...document.querySelectorAll("button, a[href]")].filter((b) => !(b.textContent?.trim() || b.getAttribute("aria-label"))).length);
    expect(buttonsWithoutName, `${url} unnamed buttons/links`).toBe(0);
  }
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("main#main")).toBeFocused();
});
