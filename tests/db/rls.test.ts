import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { DEFAULT_ROLE_PERMISSIONS, PERMISSIONS } from "@/lib/permissions";

import { asRole, connect, createStaff } from "./helpers";

const sql = connect();
let ids: Record<string, string> = {};
let draftProjectId = "";
let publishedProjectId = "";
let packageId = "";

beforeAll(async () => {
  ids = {
    owner: await createStaff(sql, "owner"),
    admin: await createStaff(sql, "admin"),
    manager: await createStaff(sql, "manager"),
    editor: await createStaff(sql, "editor"),
    viewer: await createStaff(sql, "viewer"),
    inactiveAdmin: await createStaff(sql, "admin", false),
  };
  [{ id: draftProjectId }] = await sql`insert into projects (slug, title) values ('rls-draft', 'Draft') returning id`;
  [{ id: publishedProjectId }] = await sql`
    insert into projects (slug, title, is_published, published_at) values ('rls-pub', 'Pub', true, now()) returning id`;
  await sql`insert into project_metrics (project_id, label, value) values (${draftProjectId}, 'secret', '1'), (${publishedProjectId}, 'public', '2')`;
  [{ id: packageId }] = await sql`
    insert into sponsorship_packages (slug, name, is_published) values ('rls-pkg', 'Pkg', true) returning id`;
  await sql`insert into sponsorship_package_rates (package_id, standard_rate, minimum_rate, negotiation_notes)
            values (${packageId}, 5000, 3500, 'floor is 3500')`;
  await sql`insert into contact_inquiries (name, email, message) values ('A', 'a@example.com', 'hello')`;
  await sql`insert into audit_logs (action) values ('test.event')`;
});
afterAll(() => sql.end());

describe("role permission seed", () => {
  it("matches src/lib/permissions.ts exactly", async () => {
    const perms = await sql<{ key: string }[]>`select key from permissions order by key`;
    expect(perms.map((p) => p.key)).toEqual([...PERMISSIONS].sort());
    for (const [role, expected] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
      const rows = await sql<{ permission_key: string }[]>`
        select permission_key from role_permissions where role = ${role}::app_role order by 1`;
      expect(rows.map((r) => r.permission_key), role).toEqual([...expected].sort());
    }
  });
});

describe("anonymous (publishable key) access", () => {
  it("sees only published projects and their children", async () => {
    await asRole(sql, "anon", null, async (tx) => {
      const projects = await tx`select slug from projects`;
      expect(projects.map((p) => p.slug)).toEqual(["rls-pub"]);
      const metrics = await tx`select label from project_metrics`;
      expect(metrics.map((m) => m.label)).toEqual(["public"]);
    });
  });

  it("cannot read internal sponsorship rates, inquiries, audit logs, profiles or rate limits", async () => {
    for (const table of ["sponsorship_package_rates", "contact_inquiries", "sponsorship_inquiries", "audit_logs", "profiles", "inquiry_notes"]) {
      await expect(asRole(sql, "anon", null, (tx) => tx.unsafe(`select * from ${table}`)), table).rejects.toThrow(
        /permission denied/,
      );
    }
    const rl = await asRole(sql, "anon", null, (tx) => tx`select * from rate_limits`).catch((e) => e);
    expect(rl instanceof Error || (Array.isArray(rl) && rl.length === 0)).toBe(true);
  });

  it("cannot insert inquiries or content directly", async () => {
    await expect(
      asRole(sql, "anon", null, (tx) => tx`insert into contact_inquiries (name, email, message) values ('x','x@x.io','m')`),
    ).rejects.toThrow();
    await expect(asRole(sql, "anon", null, (tx) => tx`insert into projects (slug, title) values ('hack','Hack')`)).rejects.toThrow(
      /row-level security/,
    );
  });

  it("cannot read internal.* site settings", async () => {
    const rows = await asRole(sql, "anon", null, (tx) => tx`select key from site_settings`);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.some((r) => String(r.key).startsWith("internal."))).toBe(false);
  });
});

describe("authenticated staff access", () => {
  it("viewer reads drafts but cannot write, and cannot read inquiries or rates", async () => {
    await asRole(sql, "authenticated", ids.viewer, async (tx) => {
      const projects = await tx`select slug from projects order by slug`;
      expect(projects.map((p) => p.slug)).toEqual(["rls-draft", "rls-pub"]);
      expect(await tx`select * from contact_inquiries`).toHaveLength(0);
      expect(await tx`select * from sponsorship_package_rates`).toHaveLength(0);
    });
    await expect(
      asRole(sql, "authenticated", ids.viewer, (tx) => tx`insert into projects (slug, title) values ('v','V')`),
    ).rejects.toThrow(/row-level security/);
  });

  it("editor can create but not delete projects, and cannot see rates", async () => {
    await asRole(sql, "authenticated", ids.editor, async (tx) => {
      await tx`insert into projects (slug, title) values ('editor-made', 'E')`;
      const deleted = await tx`delete from projects where id = ${draftProjectId} returning id`;
      expect(deleted).toHaveLength(0); // RLS silently filters DELETE
      expect(await tx`select * from sponsorship_package_rates`).toHaveLength(0);
    });
  });

  it("manager can read rates and inquiries", async () => {
    await asRole(sql, "authenticated", ids.manager, async (tx) => {
      const rates = await tx`select standard_rate from sponsorship_package_rates`;
      expect(rates).toHaveLength(1);
      expect(await tx`select * from contact_inquiries`).toHaveLength(1);
    });
  });

  it("inactive profiles get no staff access", async () => {
    await asRole(sql, "authenticated", ids.inactiveAdmin, async (tx) => {
      const projects = await tx`select slug from projects`;
      expect(projects.map((p) => p.slug)).toEqual(["rls-pub"]);
      expect(await tx`select * from audit_logs`).toHaveLength(0);
    });
  });

  it("authenticated users cannot escalate their own role", async () => {
    await asRole(sql, "authenticated", ids.editor, async (tx) => {
      const updated = await tx`update profiles set role = 'owner' where id = ${ids.editor} returning id`;
      expect(updated).toHaveLength(0);
    });
    const [p] = await sql`select role from profiles where id = ${ids.editor}`;
    expect(p.role).toBe("editor");
  });

  it("security-definer helpers are not callable by anon", async () => {
    await expect(asRole(sql, "anon", null, (tx) => tx`select private.has_permission('cms.read')`)).rejects.toThrow(
      /permission denied/,
    );
    await expect(
      asRole(sql, "authenticated", ids.admin, (tx) => tx`select private.promote_to_owner('x@y.z')`),
    ).rejects.toThrow(/permission denied/);
  });
});

describe("profile lifecycle", () => {
  it("new auth users get an inactive viewer profile", async () => {
    const id = crypto.randomUUID();
    await sql`insert into auth.users (id, email) values (${id}, 'newbie@test.local')`;
    const [p] = await sql`select role, is_active from profiles where id = ${id}`;
    expect(p).toEqual({ role: "viewer", is_active: false });
  });

  it("the last active owner cannot be demoted", async () => {
    // demote all other owners first (there is exactly one from beforeAll)
    await expect(sql`update profiles set role = 'admin' where id = ${ids.owner}`).rejects.toThrow(/last active owner/);
    const second = await createStaff(sql, "owner");
    await sql`update profiles set role = 'admin' where id = ${ids.owner}`;
    await sql`update profiles set role = 'owner' where id = ${ids.owner}`;
    await sql`update profiles set is_active = false where id = ${second}`;
  });
});

describe("constraints", () => {
  it("rejects unsafe URLs and bad slugs", async () => {
    await expect(sql`insert into projects (slug, title, project_url) values ('ok-slug','T','javascript:alert(1)')`).rejects.toThrow();
    await expect(sql`insert into projects (slug, title) values ('Bad Slug','T')`).rejects.toThrow();
    await expect(
      sql`insert into media_assets (bucket, path, filename, original_filename, mime_type, kind, size_bytes)
          values ('media-library', '../etc/passwd', 'x', 'x', 'image/png', 'image', 1)`,
    ).rejects.toThrow();
  });

  it("allows reusing a slug after soft delete", async () => {
    await sql`update projects set deleted_at = now() where slug = 'rls-draft'`;
    await sql`insert into projects (slug, title) values ('rls-draft', 'Again')`;
  });

  it("rate_limit_hit counts within a window", async () => {
    const [a] = await sql`select private.rate_limit_hit('t:1', 60) as c`;
    const [b] = await sql`select private.rate_limit_hit('t:1', 60) as c`;
    expect(b.c).toBe(a.c + 1);
  });
});

describe("client portal isolation", () => {
  let clientA = "";
  let clientB = "";
  let userA = "";
  let threadB = "";
  beforeAll(async () => {
    [{ id: clientA }] = await sql`insert into clients (company_name) values ('Client A') returning id`;
    [{ id: clientB }] = await sql`insert into clients (company_name) values ('Client B') returning id`;
    userA = crypto.randomUUID();
    await sql`insert into auth.users (id, email) values (${userA}, 'portal-a@test.local')`;
    await sql`update profiles set kind = 'client', client_id = ${clientA}, is_active = true where id = ${userA}`;
    [{ id: threadB }] = await sql`insert into message_threads (client_id, subject) values (${clientB}, 'B only') returning id`;
    await sql`insert into messages (thread_id, author_kind, body) values (${threadB}, 'staff', 'secret for B')`;
  });

  it("a client user has no staff permissions even though active", async () => {
    const [{ ok }] = await asRole(sql, "authenticated", userA, (tx) => tx`select private.has_permission('cms.read') as ok`).catch(() => [{ ok: "err" }]);
    expect(ok === false || ok === "err").toBe(true);
    await asRole(sql, "authenticated", userA, async (tx) => {
      expect(await tx`select slug from projects where not is_published`).toHaveLength(0);
      expect(await tx`select * from contact_inquiries`).toHaveLength(0);
    });
  });

  it("clients only see and write their own threads/messages", async () => {
    await asRole(sql, "authenticated", userA, async (tx) => {
      expect(await tx`select * from message_threads where id = ${threadB}`).toHaveLength(0);
      expect(await tx`select * from messages where thread_id = ${threadB}`).toHaveLength(0);
      const [t] = await tx`insert into message_threads (client_id, subject, created_by) values (${clientA}, 'Mine', ${userA}) returning id`;
      await tx`insert into messages (thread_id, author_id, author_kind, body) values (${t!.id}, ${userA}, 'client', 'hello')`;
      expect(await tx`select body from messages`).toEqual([{ body: "hello" }]);
    });
    await expect(asRole(sql, "authenticated", userA, (tx) => tx`insert into message_threads (client_id, subject, created_by) values (${clientB}, 'x', ${userA})`)).rejects.toThrow(/row-level security/);
    await expect(asRole(sql, "authenticated", userA, (tx) => tx`insert into messages (thread_id, author_id, author_kind, body) values (${threadB}, ${userA}, 'client', 'x')`)).rejects.toThrow(/row-level security/);
  });

  it("clients can submit only pending, unpublished testimonials for themselves", async () => {
    await asRole(sql, "authenticated", userA, async (tx) => {
      await tx`insert into testimonials (client_id, submitted_by, author_name, quote, rating, consent_to_publish) values (${clientA}, ${userA}, 'A', 'Great engineering work.', 5, true)`;
    });
    await expect(
      asRole(sql, "authenticated", userA, (tx) => tx`insert into testimonials (client_id, submitted_by, author_name, quote, rating, is_published, status, consent_to_publish) values (${clientA}, ${userA}, 'A', 'Great engineering work.', 5, true, 'approved', true)`),
    ).rejects.toThrow(/row-level security/);
  });

  it("testimonials cannot be published without approval and consent", async () => {
    await expect(sql`insert into testimonials (author_name, quote, rating, is_published, status) values ('X', 'Some quote here', 4, true, 'approved')`).rejects.toThrow(/testimonials_publish_requires_approval/);
    await expect(sql`insert into testimonials (author_name, quote, rating) values ('X', 'Some quote here', 6)`).rejects.toThrow();
  });

  it("editors read client conversations; viewers do not", async () => {
    await asRole(sql, "authenticated", ids.editor, async (tx) => {
      expect((await tx`select * from messages where thread_id = ${threadB}`).length).toBe(1);
    });
    await asRole(sql, "authenticated", ids.viewer, async (tx) => {
      expect(await tx`select * from messages`).toHaveLength(0);
    });
  });
});

describe("locked founders", () => {
  it("are seeded, cannot be renamed or deleted, but other fields are editable", async () => {
    const rows = await sql`select slug, name, is_locked from team_members where is_locked order by sort_order`;
    expect(rows.map((r) => r.name)).toEqual(["Hammadullah", "Maaz Ali"]);
    await expect(sql`update team_members set name = 'Someone else' where slug = 'maaz-ali'`).rejects.toThrow(/locked/);
    await expect(sql`update team_members set deleted_at = now() where slug = 'maaz-ali'`).rejects.toThrow(/locked/);
    await expect(sql`delete from team_members where slug = 'hammadullah'`).rejects.toThrow(/locked/);
    await expect(sql`update team_members set is_locked = false where slug = 'hammadullah'`).rejects.toThrow(/locked/);
    await sql`update team_members set bio = 'Builds agents.', role_title = 'Co-founder' where slug = 'hammadullah'`;
  });
});
