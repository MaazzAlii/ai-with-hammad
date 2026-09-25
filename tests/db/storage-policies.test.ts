import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { asRole, connect, createStaff } from "./helpers";

const sql = connect();
const ids: Record<string, string> = {};

beforeAll(async () => {
  for (const r of ["admin", "manager", "editor", "viewer"]) ids[r] = await createStaff(sql, r);
});
afterAll(() => sql.end());

const insertObject = (bucket: string, name: string) => (tx: Parameters<Parameters<typeof asRole>[3]>[0]) =>
  tx`insert into storage.objects (bucket_id, name, metadata) values (${bucket}, ${name}, '{"size":1}') returning id`;

describe("storage buckets", () => {
  it("are configured with MIME allow-lists and size limits", async () => {
    const buckets = await sql`select id, public, file_size_limit, allowed_mime_types from storage.buckets order by id`;
    expect(buckets).toHaveLength(10);
    for (const b of buckets) {
      expect(Number(b.file_size_limit), b.id).toBeGreaterThan(0);
      expect(b.allowed_mime_types.length, b.id).toBeGreaterThan(0);
      expect(b.allowed_mime_types.some((m: string) => /html|javascript|x-msdownload|x-sh/.test(m)), b.id).toBe(false);
    }
    expect(buckets.find((b) => b.id === "private-documents")!.public).toBe(false);
    // SVG only allowed in site-assets
    expect(buckets.filter((b) => b.allowed_mime_types.includes("image/svg+xml")).map((b) => b.id)).toEqual(["site-assets"]);
  });
});

describe("storage.objects policies", () => {
  it("anon cannot upload or list", async () => {
    await expect(asRole(sql, "anon", null, insertObject("media-library", "a/x.png"))).rejects.toThrow(/row-level security/);
    await sql`insert into storage.objects (bucket_id, name) values ('media-library', 'seed/listed.png')`;
    const rows = await asRole(sql, "anon", null, (tx) => tx`select name from storage.objects`);
    expect(rows).toHaveLength(0);
  });

  it("viewer cannot upload; editor can", async () => {
    await expect(asRole(sql, "authenticated", ids.viewer, insertObject("media-library", "v/x.png"))).rejects.toThrow(
      /row-level security/,
    );
    const r = await asRole(sql, "authenticated", ids.editor, insertObject("media-library", "e/x.png"));
    expect(r).toHaveLength(1);
  });

  it("blocks executable/HTML extensions even for admins", async () => {
    for (const name of ["a/evil.html", "a/evil.js", "a/evil.exe", "a/evil.svg"]) {
      await expect(asRole(sql, "authenticated", ids.admin, insertObject("media-library", name)), name).rejects.toThrow(
        /row-level security/,
      );
    }
  });

  it("site-assets (SVG allowed) requires settings.write", async () => {
    await expect(asRole(sql, "authenticated", ids.manager, insertObject("site-assets", "logo.svg"))).rejects.toThrow(
      /row-level security/,
    );
    const r = await asRole(sql, "authenticated", ids.admin, insertObject("site-assets", "logo.svg"));
    expect(r).toHaveLength(1);
  });

  it("editor cannot delete; manager can", async () => {
    await sql`insert into storage.objects (bucket_id, name) values ('media-library', 'del/me.png')`;
    const byEditor = await asRole(sql, "authenticated", ids.editor, (tx) =>
      tx`delete from storage.objects where name = 'del/me.png' returning id`,
    );
    expect(byEditor).toHaveLength(0);
    const byManager = await asRole(sql, "authenticated", ids.manager, (tx) =>
      tx`delete from storage.objects where name = 'del/me.png' returning id`,
    );
    expect(byManager).toHaveLength(1);
  });

  it("does not affect buckets outside the app", async () => {
    await sql`insert into storage.buckets (id, name, public) values ('other', 'other', false) on conflict do nothing`;
    await expect(asRole(sql, "authenticated", ids.admin, insertObject("other", "x.png"))).rejects.toThrow(/row-level security/);
  });
});
