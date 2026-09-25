import { expect, test } from "@playwright/test";

const PAGES = ["/", "/about", "/services", "/projects", "/team", "/content", "/sponsorship", "/media-kit", "/contact", "/privacy-policy", "/terms", "/cookie-policy", "/services/workflow-automation"];

test.describe("technical SEO", () => {
  test("every public page has a unique title, description and canonical", async ({ page }) => {
    const titles = new Set<string>();
    const descriptions = new Set<string>();
    for (const url of PAGES) {
      await page.goto(url);
      const title = await page.title();
      const desc = await page.locator('meta[name="description"]').getAttribute("content");
      const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
      expect(title.length, url).toBeGreaterThan(5);
      expect(desc?.length ?? 0, url).toBeGreaterThan(20);
      expect(canonical?.replace(/\/$/, ""), url).toBe(new URL(url, "http://localhost:3000").toString().replace(/\/$/, ""));
      expect(titles.has(title), `duplicate title ${title}`).toBe(false);
      expect(descriptions.has(desc!), `duplicate description on ${url}`).toBe(false);
      titles.add(title);
      descriptions.add(desc!);
      await expect(page.locator('meta[property="og:title"]')).toHaveCount(1);
      // JSON-LD must parse
      for (const s of await page.locator('script[type="application/ld+json"]').allTextContents()) expect(() => JSON.parse(s)).not.toThrow();
    }
  });

  test("organization and breadcrumb structured data are present", async ({ page }) => {
    await page.goto("/services/workflow-automation");
    const blocks = (await page.locator('script[type="application/ld+json"]').allTextContents()).flatMap((s) => [JSON.parse(s)].flat());
    const types = blocks.map((b) => b["@type"]);
    expect(types).toEqual(expect.arrayContaining(["Organization", "WebSite", "Service", "BreadcrumbList"]));
  });

  test("sitemap lists published content only; robots disallows admin", async ({ request }) => {
    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect(sitemap).toContain("<loc>http://localhost:3000/services/workflow-automation</loc>");
    expect(sitemap).not.toContain("/admin");
    expect(sitemap).not.toContain("editor-draft");
    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toMatch(/Disallow: \/admin/);
    expect(robots).toContain("Sitemap: http://localhost:3000/sitemap.xml");
  });

  test("admin and login are noindex; security headers are set", async ({ request }) => {
    const login = await request.get("/login");
    expect(login.headers()["x-robots-tag"]).toContain("noindex");
    expect(await login.text()).toContain('name="robots" content="noindex');
    const home = await request.get("/");
    const h = home.headers();
    expect(h["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(h["x-content-type-options"]).toBe("nosniff");
    expect(h["x-frame-options"]).toBe("DENY");
    expect(h["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(h["x-powered-by"]).toBeUndefined();
  });

  test("default Open Graph image renders", async ({ request }) => {
    const res = await request.get("/opengraph-image");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toBe("image/png");
  });
});
