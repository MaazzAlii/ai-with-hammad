import { expect, test } from "@playwright/test";
import path from "node:path";

import { db, expectToast, newContext } from "./helpers";

test.describe("media library", () => {
  test("upload → record → edit alt text → public URL → delete", async ({ browser }) => {
    const ctx = await newContext(browser, "manager");
    const page = await ctx.newPage();
    await page.goto("/admin/media");
    await page.getByLabel("Upload to").selectOption("media-library");
    await expect(page.locator('[data-testid="media-file-input"]')).toBeEnabled();
    await page.locator('[data-testid="media-file-input"]').setInputFiles(path.resolve(__dirname, "fixtures/gallery.png"));
    await expectToast(page, "gallery.png uploaded");
    const sql = db();
    const [row] = await sql`select id, bucket, path, mime_type, size_bytes, width, height, uploaded_by from media_assets where original_filename = 'gallery.png' order by created_at desc limit 1`;
    expect(row).toMatchObject({ bucket: "media-library", mime_type: "image/png", width: 120, height: 80 });
    expect(row!.uploaded_by).not.toBeNull();
    const [obj] = await sql`select metadata from storage.objects where bucket_id = ${row!.bucket} and name = ${row!.path}`;
    expect(Number(obj!.metadata.size)).toBe(Number(row!.size_bytes));

    await page.goto(`/admin/media/${row!.id}`);
    await page.getByLabel("Alt text").fill("Teal test swatch");
    await page.getByRole("button", { name: "Save" }).click();
    await expectToast(page, "Media updated");
    const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321"}/storage/v1/object/public/media-library/${row!.path}`;
    const res = await page.request.get(publicUrl);
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toBe("image/png");

    await page.getByRole("button", { name: "Delete" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Delete" }).click();
    await expect(page).toHaveURL(/\/admin\/media$/);
    expect(await sql`select 1 from media_assets where id = ${row!.id}`).toHaveLength(0);
    expect(await sql`select 1 from storage.objects where name = ${row!.path}`).toHaveLength(0);
    await sql.end();
    await ctx.close();
  });

  test("rejects disallowed file types before upload", async ({ browser }) => {
    const ctx = await newContext(browser, "editor");
    const page = await ctx.newPage();
    await page.goto("/admin/media");
    await expect(page.locator('[data-testid="media-file-input"]')).toBeEnabled();
    await page.locator('[data-testid="media-file-input"]').setInputFiles(path.resolve(__dirname, "fixtures/evil.html"));
    await expect(page.locator("[data-sonner-toast]").first()).toContainText(/not allowed/);
    await ctx.close();
  });

  test("storage RLS blocks a viewer uploading directly with their own session", async ({ browser }) => {
    const ctx = await newContext(browser, "viewer");
    const page = await ctx.newPage();
    await page.goto("/admin");
    const cookies = await ctx.cookies();
    const auth = cookies.find((c) => c.name.startsWith("sb-") && c.name.includes("auth-token"));
    expect(auth).toBeTruthy();
    const raw = decodeURIComponent(auth!.value).replace(/^base64-/, "");
    const session = JSON.parse(Buffer.from(raw, "base64").toString("utf8"));
    const res = await page.request.post(`${process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321"}/storage/v1/object/media-library/2026/01/00000000-0000-0000-0000-000000000000-x.png`, {
      headers: { authorization: `Bearer ${session.access_token}`, "content-type": "image/png" },
      data: Buffer.from("fake"),
    });
    expect(res.status()).toBe(403);
    await ctx.close();
  });

  test("editors cannot delete media", async ({ browser }) => {
    const sql = db();
    const [m] = await sql`insert into media_assets (bucket, path, filename, original_filename, mime_type, kind, size_bytes)
      values ('media-library', ${`2026/01/${crypto.randomUUID()}-x.png`}, 'x.png', 'x.png', 'image/png', 'image', 10) returning id`;
    await sql.end();
    const ctx = await newContext(browser, "editor");
    const page = await ctx.newPage();
    await page.goto(`/admin/media/${m!.id}`);
    await expect(page.getByRole("heading", { name: "x.png" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Delete" })).toHaveCount(0);
    await ctx.close();
  });
});
