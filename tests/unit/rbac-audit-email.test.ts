import { describe, expect, it, vi } from "vitest";

import { canManageRole, DEFAULT_ROLE_PERMISSIONS, PERMISSIONS } from "@/lib/permissions";
import { scrubMetadata } from "@/server/audit";
import { sendEmailSafely } from "@/server/email";
import type { EmailProvider } from "@/server/email/types";
import { inquiryNotification } from "@/server/email/templates";

describe("role matrix", () => {
  it("owner/admin have everything; viewer only reads", () => {
    expect([...DEFAULT_ROLE_PERMISSIONS.owner].sort()).toEqual([...PERMISSIONS].sort());
    expect(DEFAULT_ROLE_PERMISSIONS.viewer).toEqual(["cms.read"]);
  });
  it("editors cannot publish, delete, see rates or inquiries", () => {
    const e = new Set(DEFAULT_ROLE_PERMISSIONS.editor);
    for (const p of ["projects.publish", "projects.delete", "sponsorship.rates", "inquiries.read", "media.delete", "users.manage"] as const) expect(e.has(p), p).toBe(false);
  });
  it("managers can see rates but not manage users or settings", () => {
    const m = new Set(DEFAULT_ROLE_PERMISSIONS.manager);
    expect(m.has("sponsorship.rates")).toBe(true);
    expect(m.has("users.manage")).toBe(false);
    expect(m.has("settings.write")).toBe(false);
  });
  it("admins cannot grant or modify the owner role", () => {
    expect(canManageRole("owner", "owner", "admin")).toBe(true);
    expect(canManageRole("admin", "editor", "manager")).toBe(true);
    expect(canManageRole("admin", "owner", "admin")).toBe(false);
    expect(canManageRole("admin", "editor", "owner")).toBe(false);
    expect(canManageRole("manager", "viewer", "editor")).toBe(false);
  });
});

describe("audit metadata scrubbing", () => {
  it("redacts secrets and internal rates", () => {
    const out = scrubMetadata({ password: "x", apiKey: "k", nested: { token: "t", standardRate: 5000, ok: "fine" }, list: [{ secret: 1 }] }) as Record<string, unknown>;
    expect(out.password).toBe("[redacted]");
    expect(out.apiKey).toBe("[redacted]");
    expect((out.nested as Record<string, unknown>).token).toBe("[redacted]");
    expect((out.nested as Record<string, unknown>).standardRate).toBe("[redacted]");
    expect((out.nested as Record<string, unknown>).ok).toBe("fine");
    expect((out.list as Record<string, unknown>[])[0]!.secret).toBe("[redacted]");
  });
});

describe("email", () => {
  it("never throws when the provider fails or hangs", async () => {
    const throwing: EmailProvider = { name: "t", send: vi.fn().mockRejectedValue(new Error("boom")) };
    expect(await sendEmailSafely({ to: ["a@b.c"], subject: "s", text: "t" }, throwing)).toEqual({ status: "failed", error: "boom" });
    const hanging: EmailProvider = { name: "h", send: () => new Promise(() => {}) };
    expect((await sendEmailSafely({ to: ["a@b.c"], subject: "s", text: "t" }, hanging, 50)).status).toBe("failed");
    expect((await sendEmailSafely({ to: [], subject: "s", text: "t" }, throwing)).status).toBe("skipped");
  });
  it("notification subject cannot inject headers", () => {
    const m = inquiryNotification("contact", { Name: "Eve\r\nBcc: x@y.z" }, "/admin");
    expect(m.subject).not.toMatch(/[\r\n]/);
  });
});
