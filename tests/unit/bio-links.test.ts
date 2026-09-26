import { describe, expect, it } from "vitest";

import { bioLinkSchema } from "@/lib/validation/admin";

const base = { title: "Latest video", url: "https://youtube.com/watch?v=abc", isPublished: "on" };

describe("bio link schema", () => {
  it("accepts https and mailto links with defaults", () => {
    const r = bioLinkSchema.parse(base);
    expect(r).toMatchObject({ kind: "link", icon: "", teamMemberId: null, isPublished: true, isFeatured: false, startsAt: null, endsAt: null });
    expect(bioLinkSchema.parse({ ...base, url: "mailto:hello@example.com" }).url).toBe("mailto:hello@example.com");
  });

  it.each(["http://example.com", "javascript:alert(1)", "https://user:pass@example.com", "ftp://x.y", "mailto:not-an-email"])("rejects unsafe url %s", (url) => {
    expect(bioLinkSchema.safeParse({ ...base, url }).success).toBe(false);
  });

  it("rejects unknown kinds and icons", () => {
    expect(bioLinkSchema.safeParse({ ...base, kind: "script" }).success).toBe(false);
    expect(bioLinkSchema.safeParse({ ...base, icon: "<svg>" }).success).toBe(false);
  });

  it("requires the schedule end to be after the start", () => {
    expect(bioLinkSchema.safeParse({ ...base, startsAt: "2026-10-02T10:00", endsAt: "2026-10-01T10:00" }).success).toBe(false);
    expect(bioLinkSchema.parse({ ...base, startsAt: "2026-10-01T10:00", endsAt: "" }).endsAt).toBeNull();
  });
});

describe("whyNotLive", async () => {
  const { whyNotLive } = await import("@/server/dal/public/links");
  const base = { isPublished: true, deletedAt: null, startsAt: null, endsAt: null, url: "mailto:hello@example.com" };
  const now = new Date("2026-09-26T12:00:00Z");

  it("is live when published, in schedule and the URL is valid", () => {
    expect(whyNotLive(base, now)).toBeNull();
    expect(whyNotLive({ ...base, url: "https://example.com" }, now)).toBeNull();
  });

  it("explains every reason a link is hidden", () => {
    expect(whyNotLive({ ...base, isPublished: false }, now)).toMatch(/Published is off/);
    expect(whyNotLive({ ...base, deletedAt: now }, now)).toBe("deleted");
    expect(whyNotLive({ ...base, startsAt: new Date("2026-09-27T00:00:00Z") }, now)).toMatch(/scheduled/);
    expect(whyNotLive({ ...base, endsAt: new Date("2026-09-25T00:00:00Z") }, now)).toMatch(/expired/);
    expect(whyNotLive({ ...base, url: "http://insecure.example" }, now)).toMatch(/URL/);
  });
});
