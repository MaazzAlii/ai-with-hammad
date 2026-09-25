import { expect, test } from "@playwright/test";

import { db, newContext, uid } from "./helpers";

test.describe("role restrictions (server-enforced)", () => {
  test("viewer: read-only CMS, no inquiries, settings or users", async ({ browser }) => {
    const ctx = await newContext(browser, "viewer");
    const page = await ctx.newPage();
    await page.goto("/admin");
    const nav = page.getByRole("navigation", { name: "Admin" });
    await expect(nav.getByRole("link", { name: "Projects" })).toBeVisible();
    for (const hidden of ["Inquiries", "Settings", "Users", "Audit log"]) await expect(nav.getByRole("link", { name: hidden })).toHaveCount(0);
    for (const url of ["/admin/inquiries", "/admin/settings", "/admin/users", "/admin/audit", "/admin/projects/new"]) {
      await page.goto(url);
      await expect(page, url).toHaveURL(/\/admin\?denied=/);
    }
    await page.goto("/admin/services");
    await page.getByRole("link", { name: "Agentic AI Systems" }).click();
    await expect(page.getByText("Read-only — you don't have permission to edit.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Save service" })).toHaveCount(0);
    await ctx.close();
  });

  test("editor: can create drafts but publish flags are ignored server-side", async ({ browser }) => {
    const ctx = await newContext(browser, "editor");
    const page = await ctx.newPage();
    const id = uid();
    const slug = `editor-draft-${id}`;
    await page.goto("/admin/projects/new");
    await expect(page.getByRole("switch", { name: "Published" })).toBeDisabled();
    await page.getByLabel("Title", { exact: true }).fill(`Editor draft ${id}`);
    await page.getByLabel("URL slug").fill(slug);
    // Forge publish/pin fields into the form — the server must ignore them.
    await page.evaluate(() => {
      const form = document.querySelector("form")!;
      for (const name of ["isPublished", "isPinned", "isFeatured"]) {
        const i = document.createElement("input");
        i.type = "hidden";
        i.name = name;
        i.value = "on";
        form.appendChild(i);
      }
    });
    await page.getByRole("button", { name: "Create project" }).click();
    await expect(page).toHaveURL(/\/admin\/projects\/[0-9a-f-]{36}$/);
    const sql = db();
    const [row] = await sql`select is_published, is_pinned, is_featured from projects where slug = ${slug}`;
    await sql.end();
    expect(row).toEqual({ is_published: false, is_pinned: false, is_featured: false });
    expect((await page.request.get(`/projects/${slug}`)).status()).toBe(404);
    // No delete button, toggles disabled.
    await expect(page.getByRole("button", { name: "Delete" })).toHaveCount(0);
    await page.goto("/admin/projects");
    await expect(page.locator("li", { hasText: `Editor draft ${id}` }).getByRole("switch", { name: "Draft" })).toBeDisabled();
    await ctx.close();
  });

  test("editor cannot see internal rates; manager can", async ({ browser }) => {
    const sql = db();
    const [pkg] = await sql`insert into sponsorship_packages (slug, name) values (${`rates-${uid()}`}, 'Rates test') returning id`;
    await sql`insert into sponsorship_package_rates (package_id, standard_rate, negotiation_notes) values (${pkg!.id}, 4242, 'INTERNAL-NOTE-XYZ')`;
    await sql.end();
    const editor = await newContext(browser, "editor");
    const ep = await editor.newPage();
    await ep.goto(`/admin/sponsorship/packages/${pkg!.id}`);
    await expect(ep.getByRole("heading", { name: "Rates test" })).toBeVisible();
    expect(await ep.content()).not.toMatch(/4242|INTERNAL-NOTE-XYZ/);
    await editor.close();
    const manager = await newContext(browser, "manager");
    const mp = await manager.newPage();
    await mp.goto(`/admin/sponsorship/packages/${pkg!.id}`);
    await expect(mp.getByLabel("Standard rate")).toHaveValue("4242");
    await expect(mp.getByLabel("Negotiation notes")).toHaveValue("INTERNAL-NOTE-XYZ");
    await mp.goto("/admin/users");
    await expect(mp).toHaveURL(/denied=users.read/);
    await manager.close();
  });

  test("admin cannot modify the owner account", async ({ browser }) => {
    const ctx = await newContext(browser, "admin");
    const page = await ctx.newPage();
    await page.goto("/admin/users");
    const owner = page.locator("li", { hasText: "owner@e2e.test" });
    await owner.locator("summary").click();
    await expect(owner.getByLabel("Role")).toHaveCount(0);
    const editor = page.locator("li", { hasText: "editor@e2e.test" });
    await editor.locator("summary").click();
    await expect(editor.getByLabel("Role").locator("option[value=owner]")).toHaveCount(0);
    await ctx.close();
  });
});
