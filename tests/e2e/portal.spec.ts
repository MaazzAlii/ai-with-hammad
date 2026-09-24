import { expect, test, type Browser } from "@playwright/test";
import dotenv from "dotenv";

import { db, expectToast, login, newContext, PASSWORD, uid } from "./helpers";

dotenv.config({ path: ".env.local" });

/** Create a client company + an active portal user through the real Auth server. */
async function createPortalUser(company: string) {
  const email = `client-${uid()}@e2e.test`;
  const key = process.env.SUPABASE_SECRET_KEY!;
  const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, apikey: key, "content-type": "application/json" },
    body: JSON.stringify({ email, password: PASSWORD, email_confirm: true, user_metadata: { full_name: `Contact ${company}` } }),
  });
  expect(res.ok).toBe(true);
  const sql = db();
  const [c] = await sql`insert into clients (company_name) values (${company}) returning id`;
  await sql`update profiles set kind = 'client', client_id = ${c!.id}, is_active = true where email = ${email}`;
  await sql.end();
  return { email, clientId: c!.id as string };
}

async function portalLogin(browser: Browser, email: string) {
  const ctx = await newContext(browser);
  const page = await ctx.newPage();
  await login(page, email, PASSWORD, "/portal/login");
  await expect(page).toHaveURL(/\/portal$/);
  return { ctx, page };
}

test.describe("client portal", () => {
  test("client ↔ team conversation, with notifications of unread state", async ({ browser }) => {
    const company = `Acme ${uid()}`;
    const { email } = await createPortalUser(company);
    const { ctx, page } = await portalLogin(browser, email);
    await page.getByRole("link", { name: "New message" }).first().click();
    await page.getByLabel("Subject").fill("Question about the CRM sync");
    await page.getByLabel("Message").fill("Can the workflow also update deal stages?");
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(page).toHaveURL(/\/portal\/messages\/[0-9a-f-]{36}$/);
    await expect(page.getByText("Can the workflow also update deal stages?")).toBeVisible();
    const threadUrl = page.url();
    await page.goto("/portal"); // leave the thread (an open thread auto-refreshes and marks replies read)

    // An editor (team member) sees it as unread and replies.
    const staff = await newContext(browser, "editor");
    const sp = await staff.newPage();
    await sp.goto("/admin/messages?unread=1");
    await sp.getByRole("link", { name: /Question about the CRM sync/ }).click();
    await expect(sp.getByText(company).first()).toBeVisible();
    await sp.getByRole("textbox", { name: "Message" }).fill("Yes — we can map stages in the next iteration.");
    await sp.getByRole("button", { name: "Send" }).click();
    await expect(sp.getByText("Yes — we can map stages in the next iteration.")).toBeVisible();

    // Client sees the reply.
    await page.goto("/portal");
    await expect(page.getByText("New reply")).toBeVisible();
    await page.goto(threadUrl);
    await expect(page.getByText("Yes — we can map stages in the next iteration.")).toBeVisible();
    await page.getByRole("textbox", { name: "Message" }).fill("Great, thanks!");
    await page.getByRole("button", { name: "Send" }).click();
    await expect(page.getByText("Great, thanks!")).toBeVisible();
    await ctx.close();
    await staff.close();
  });

  test("clients are isolated from each other, from the CMS and from staff login", async ({ browser }) => {
    const a = await createPortalUser(`Alpha ${uid()}`);
    const b = await createPortalUser(`Beta ${uid()}`);
    const sql = db();
    const [t] = await sql`insert into message_threads (client_id, subject) values (${b.clientId}, 'Beta private') returning id`;
    await sql`insert into messages (thread_id, author_kind, body) values (${t!.id}, 'staff', 'BETA-SECRET')`;
    await sql.end();

    const { ctx, page } = await portalLogin(browser, a.email);
    const res = await page.goto(`/portal/messages/${t!.id}`);
    expect(res?.status()).toBe(404);
    expect(await page.content()).not.toContain("BETA-SECRET");
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login/);
    await ctx.close();

    const staffLogin = await newContext(browser);
    const sp = await staffLogin.newPage();
    await login(sp, a.email);
    await expect(sp.getByText(/client account/)).toBeVisible();
    await staffLogin.close();
  });

  test("viewers cannot read client conversations", async ({ browser }) => {
    const ctx = await newContext(browser, "viewer");
    const page = await ctx.newPage();
    await page.goto("/admin/messages");
    await expect(page).toHaveURL(/denied=messages.read/);
    await ctx.close();
  });

  test("testimonial: client submits → manager approves and publishes → shown publicly", async ({ browser }) => {
    const company = `Gamma ${uid()}`;
    const quote = `The agent they built saves our team hours every week ${uid()}.`;
    const { email } = await createPortalUser(company);
    const { ctx, page } = await portalLogin(browser, email);
    await page.goto("/portal/feedback");
    await page.getByRole("radio", { name: /5 stars/ }).check({ force: true });
    await page.getByLabel("Your testimonial").fill(quote);
    await page.getByLabel("Role / title").fill("Operations lead");
    await page.getByRole("switch", { name: /publish this testimonial/ }).click();
    await page.getByRole("button", { name: "Send feedback" }).click();
    await expectToast(page, /Thank you/);
    await ctx.close();

    const pub0 = await (await browser.newContext()).newPage();
    await pub0.goto("/testimonials");
    await expect(pub0.getByText(quote)).toHaveCount(0);

    const mgr = await newContext(browser, "manager");
    const mp = await mgr.newPage();
    await mp.goto("/admin/testimonials?status=pending");
    const card = mp.locator("li", { hasText: quote });
    await card.getByRole("button", { name: "Approve" }).click();
    await expectToast(mp, "Marked approved");
    await mp.goto("/admin/testimonials?status=approved");
    await mp.locator("li", { hasText: quote }).getByRole("button", { name: "Publish on website" }).click();
    await expectToast(mp, "Published");
    await mgr.close();

    await pub0.goto("/testimonials");
    await expect(pub0.getByText(quote)).toBeVisible();
    await expect(pub0.getByRole("img", { name: "5 out of 5 stars" }).first()).toBeVisible();
  });

  test("editors cannot moderate testimonials", async ({ browser }) => {
    const ctx = await newContext(browser, "editor");
    const page = await ctx.newPage();
    await page.goto("/admin/testimonials/new");
    await expect(page).toHaveURL(/denied=testimonials.moderate/);
    await ctx.close();
  });
});

test.describe("founders", () => {
  test("names are fixed in the CMS but profiles stay editable", async ({ browser }) => {
    const ctx = await newContext(browser, "owner");
    const page = await ctx.newPage();
    await page.goto("/admin/team");
    await page.getByRole("link", { name: "Maaz Ali" }).click();
    await expect(page.getByLabel("Name")).toHaveAttribute("readonly", "");
    await expect(page.getByRole("button", { name: "Delete" })).toHaveCount(0);
    await page.getByLabel("Short bio").fill("AI engineer building automation systems.");
    await page.getByRole("button", { name: "Save member" }).click();
    await expectToast(page, "Team member saved");
    const pub = await ctx.newPage();
    await pub.goto("/team/maaz-ali");
    await expect(pub.getByRole("heading", { level: 1 })).toHaveText("Maaz Ali");
    await expect(pub.getByText("AI engineer building automation systems.")).toBeVisible();
    await pub.goto("/team/hammadullah");
    await expect(pub.getByRole("heading", { level: 1 })).toHaveText("Hammadullah");
    await ctx.close();
  });
});
