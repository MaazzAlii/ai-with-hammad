import { describe, expect, it } from "vitest";
import { z } from "zod";

import { AuthError, ForbiddenError, UserFacingError } from "@/server/errors";
import { assertId, runAction } from "@/server/run-action";

describe("runAction", () => {
  it("maps auth, permission, validation and DB errors to safe messages", async () => {
    expect(await runAction(async () => { throw new AuthError(); })).toEqual({ ok: false, error: "You must be signed in." });
    expect(await runAction(async () => { throw new ForbiddenError(); })).toEqual({ ok: false, error: "You do not have permission to do that." });
    const zr = await runAction(async () => { z.object({ a: z.string() }).parse({}); return { ok: true as const }; });
    expect(zr.ok).toBe(false);
    expect(!zr.ok && zr.fieldErrors?.a).toBeTruthy();
    const dup = await runAction(async () => { throw Object.assign(new Error("x"), { cause: { code: "23505" } }); });
    expect(!dup.ok && dup.error).toMatch(/already in use/);
  });
  it("never leaks unexpected error details", async () => {
    const r = await runAction(async () => { throw new Error("connection to 10.0.0.5 failed: password=hunter2"); });
    expect(r).toEqual({ ok: false, error: "Something went wrong. Please try again." });
  });
  it("re-throws Next.js control-flow errors", async () => {
    await expect(runAction(async () => { throw Object.assign(new Error("NEXT_REDIRECT"), { digest: "NEXT_REDIRECT;replace;/x;307;" }); })).rejects.toThrow("NEXT_REDIRECT");
  });
});

describe("assertId", () => {
  it("accepts UUIDs and null, rejects anything else", () => {
    expect(assertId("123e4567-e89b-12d3-a456-426614174000")).toBe("123e4567-e89b-12d3-a456-426614174000");
    expect(assertId(null)).toBeNull();
    expect(() => assertId("1 or 1=1")).toThrow(UserFacingError);
    expect(() => assertId("../../etc")).toThrow(UserFacingError);
  });
});
