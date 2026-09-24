import { expect, test, type Page } from "@playwright/test";
import path from "node:path";

import { db, expectToast, newContext, uid } from "./helpers";

const fixture = (f: string) => path.resolve(__dirname, "fixtures", f);

async function pickUpload(page: Page, triggerName: RegExp, file: string, nth = 0) {
  await page.getByRole("button", { name: triggerName }).nth(nth).click();
  const dialog = page.getByRole("dialog");
  await dialog.locator('[data-testid="media-file-input"]').setInputFiles(fixture(file));
  await expect(dialog).toBeHidden({ timeout: 15_000 });
}

test.describe("CMS workflows (owner)", () => {
  test("create a team member and a service", async ({ browser }) => {
    const ctx = await newContext(browser, "owner");
    const page = await ctx.newPage();
    const id = uid();

    await page.goto("/admin/team/new");
    await page.getByLabel("Name", { exact: true }).fill(`Test Engineer ${id}`);
    await page.getByLabel("URL slug").fill(`test-engineer-${id}`);
    await page.getByLabel("Role", { exact: true }).fill("AI Engineer");
    await page.getByLabel("Short bio").fill("Builds agentic systems.");
    await page.getByLabel("Skills").fill("n8n, Python, LLM evaluation");
    await pickUpload(page, /^Choose$/, "portrait.png");
    await page.getByRole("switch", { name: "Published" }).click();
    await page.getByRole("switch", { name: "Core team (homepage)" }).click();
    await page.getByRole("button", { name: "Create member" }).click();
    await expect(page).toHaveURL(/\/admin\/team\/[0-9a-f-]{36}$/);
    await expectToast(page, "Team member created");

    await page.goto("/admin/services/new");
    await page.getByLabel("Title", { exact: true }).fill(`RAG Systems ${id}`);
    await page.getByLabel("URL slug").fill(`rag-systems-${id}`);
    await page.getByLabel("Summary").fill("Retrieval over your documents with evaluation.");
    await page.getByRole("button", { name: "Add feature" }).click();
    await page.getByLabel("Title").nth(1).fill("Evaluation harness");
    await page.getByRole("switch", { name: "Published" }).click();
    await page.getByRole("button", { name: "Create service" }).click();
    await expect(page).toHaveURL(/\/admin\/services\/[0-9a-f-]{36}$/);

    const pub = await ctx.newPage();
    await pub.goto(`/team/test-engineer-${id}`);
    await expect(pub.getByRole("heading", { level: 1 })).toHaveText(`Test Engineer ${id}`);
    await expect(pub.getByText("LLM evaluation")).toBeVisible();
    await pub.goto(`/services/rag-systems-${id}`);
    await expect(pub.getByText("Evaluation harness")).toBeVisible();
    await ctx.close();
  });

  test("create, upload media, publish and pin a project; it appears on the homepage", async ({ browser }) => {
    const ctx = await newContext(browser, "owner");
    const page = await ctx.newPage();
    const id = uid();
    const slug = `case-study-${id}`;
    await page.goto("/admin/projects/new");
    await page.getByLabel("Title", { exact: true }).fill(`Support triage agent ${id}`);
    await page.getByLabel("URL slug").fill(slug);
    await page.getByLabel("Short summary").fill("An LLM agent that classifies and drafts replies for support tickets.");
    await page.getByLabel("Category").fill("Agents");
    await page.getByLabel("Technologies").fill("n8n, Claude, PostgreSQL");
    await page.getByLabel("Problem").fill("Tickets waited **hours** for a first response.");
    await page.getByLabel("Results").fill("First response now happens within minutes.");
    await pickUpload(page, /^Choose$/, "cover.png");
    // gallery image + YouTube video
    await page.getByRole("button", { name: "Gallery image" }).click();
    await page.getByRole("button", { name: "Choose file" }).first().click();
    await page.getByRole("dialog").locator('[data-testid="media-file-input"]').setInputFiles(fixture("gallery.png"));
    await expect(page.getByRole("dialog")).toBeHidden({ timeout: 15_000 });
    await page.getByRole("button", { name: "YouTube video" }).click();
    await page.locator('input[id^="pm-"][id$="-url"]').last().fill("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    await page.locator('input[id^="pm-"][id$="-title"]').last().fill("Demo walkthrough");
    await page.getByRole("button", { name: "Add metric" }).click();
    await page.getByLabel("Value").fill("< 5 min");
    await page.getByLabel("Label").fill("First response time");
    await page.getByRole("switch", { name: "Published" }).click();
    await page.getByRole("switch", { name: "Pinned to homepage" }).click();
    await page.getByRole("button", { name: "Create project" }).click();
    await expect(page).toHaveURL(/\/admin\/projects\/[0-9a-f-]{36}$/);
    await expectToast(page, "Project created");

    const sql = db();
    const [row] = await sql`select id, is_published, is_pinned, published_at, cover_media_id from projects where slug = ${slug}`;
    const media = await sql`select type from project_media where project_id = ${row!.id} order by sort_order`;
    const audit = await sql`select action from audit_logs where entity_id = ${row!.id}`;
    await sql.end();
    expect(row).toMatchObject({ is_published: true, is_pinned: true });
    expect(row!.published_at).not.toBeNull();
    expect(row!.cover_media_id).not.toBeNull();
    expect(media.map((m) => m.type)).toEqual(["image", "youtube"]);
    expect(audit.map((a) => a.action)).toContain("project.create");

    const pub = await ctx.newPage();
    await pub.goto(`/projects/${slug}`);
    await expect(pub.getByRole("heading", { level: 1 })).toHaveText(`Support triage agent ${id}`);
    await expect(pub.locator("strong", { hasText: "hours" })).toBeVisible();
    await expect(pub.getByText("First response time")).toBeVisible();
    // Video uses a click-to-load facade: no iframe until requested.
    await expect(pub.locator("iframe")).toHaveCount(0);
    await pub.getByRole("button", { name: /Play video: Demo walkthrough/ }).click();
    await expect(pub.locator('iframe[src^="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"]')).toHaveCount(1);
    await pub.goto("/");
    await expect(pub.getByRole("link", { name: new RegExp(`Support triage agent ${id}`) })).toBeVisible();

    // Unpublish from the list → public page 404s
    await page.goto("/admin/projects");
    await page.locator("li", { hasText: `Support triage agent ${id}` }).getByRole("switch", { name: "Published" }).click();
    await expect.poll(async () => (await pub.request.get(`/projects/${slug}`)).status()).toBe(404);
    await ctx.close();
  });

  test("create content with metrics and highlight flags", async ({ browser }) => {
    const ctx = await newContext(browser, "owner");
    const page = await ctx.newPage();
    const id = uid();
    await page.goto("/admin/content/new");
    await page.getByLabel("Title", { exact: true }).fill(`Build an n8n agent ${id}`);
    await page.getByLabel("URL slug").fill(`n8n-agent-${id}`);
    await page.getByLabel("Post URL").fill("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    await page.getByLabel("Published on").fill("2026-09-01");
    await page.getByRole("switch", { name: "Published" }).click();
    await page.getByRole("switch", { name: "High performing" }).click();
    await page.getByRole("button", { name: "Create content" }).click();
    await expect(page).toHaveURL(/\/admin\/content\/[0-9a-f-]{36}$/);
    await page.getByLabel("Views").fill("125000");
    await page.getByLabel("Likes").fill("4300");
    await page.getByRole("button", { name: "Record metrics" }).click();
    await expectToast(page, "Metrics recorded");
    const pub = await ctx.newPage();
    await pub.goto(`/content/n8n-agent-${id}`);
    await expect(pub.getByText("125K")).toBeVisible();
    await pub.goto("/content");
    await expect(pub.getByRole("heading", { name: "Audience favourites" })).toBeVisible();
    await ctx.close();
  });

  test("inquiry pipeline: update status, assign and add a note", async ({ browser }) => {
    const sql = db();
    const [inq] = await sql`insert into contact_inquiries (name, email, message) values ('Pipeline Test', 'pipe@example.com', 'Testing the CRM pipeline flow.') returning id`;
    const ctx = await newContext(browser, "owner");
    const page = await ctx.newPage();
    await page.goto(`/admin/inquiries/contact/${inq!.id}`);
    await expect(page.getByText("Testing the CRM pipeline flow.")).toBeVisible();
    await page.getByLabel("Status").selectOption("qualified");
    await page.getByLabel("Priority").selectOption("high");
    await page.getByLabel("Assigned to").selectOption({ label: "E2E owner" });
    await page.getByRole("button", { name: "Update" }).click();
    await expectToast(page, "Inquiry updated");
    await page.getByLabel("New note").fill("Called them — proposal next week.");
    await page.getByRole("button", { name: "Add note" }).click();
    await expect(page.getByText("Called them — proposal next week.")).toBeVisible();
    const [row] = await sql`select status, priority, assigned_to, contacted_at from contact_inquiries where id = ${inq!.id}`;
    await sql.end();
    expect(row).toMatchObject({ status: "qualified", priority: "high" });
    expect(row!.assigned_to).not.toBeNull();
    expect(row!.contacted_at).not.toBeNull();
    await ctx.close();
  });

  test("sponsorship package with internal rates never leaks rates publicly", async ({ browser }) => {
    const ctx = await newContext(browser, "owner");
    const page = await ctx.newPage();
    const id = uid();
    await page.goto("/admin/sponsorship/packages/new");
    await page.getByLabel("Name").fill(`Dedicated video ${id}`);
    await page.getByLabel("Slug").fill(`dedicated-video-${id}`);
    await page.getByLabel("Deliverables").fill("1 dedicated YouTube video\n3 short-form cuts");
    await page.getByRole("switch", { name: "Published" }).click();
    await page.getByRole("button", { name: "Create package" }).click();
    await expect(page).toHaveURL(/packages\/[0-9a-f-]{36}$/);
    await page.getByLabel("Standard rate").fill("98765");
    await page.getByLabel("Minimum rate").fill("87654");
    await page.getByLabel("Negotiation notes").fill("SECRET-NEGOTIATION-FLOOR");
    await page.getByRole("button", { name: "Save internal rates" }).click();
    await expectToast(page, "Internal rates saved");
    for (const url of ["/sponsorship", "/media-kit"]) {
      const res = await page.request.get(url);
      const html = await res.text();
      expect(html).toContain(`Dedicated video ${id}`);
      expect(html).not.toMatch(/98765|98,765|87654|87,654|SECRET-NEGOTIATION-FLOOR/);
    }
    const sql = db();
    const audit = await sql`select metadata::text as m from audit_logs where action = 'sponsorship_rates.update'`;
    await sql.end();
    expect(audit.map((a) => a.m).join()).not.toMatch(/98765|SECRET/);
    await ctx.close();
  });

  test("settings changes are reflected on the public site", async ({ browser }) => {
    const ctx = await newContext(browser, "owner");
    const page = await ctx.newPage();
    await page.goto("/admin/settings?tab=home");
    await page.getByLabel("Headline").fill("Engineering AI that ships.");
    await page.getByRole("button", { name: "Save" }).click();
    await expectToast(page, "Settings saved");
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Engineering AI that ships.");
    await ctx.close();
  });
});
