import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

/**
 * Every exported function in a "use server" file is a public HTTP endpoint.
 * Each must authorize (staff or client) unless it is an intentionally public action.
 */
const PUBLIC_ACTIONS = new Set([
  "submitContactInquiry",
  "submitSponsorshipInquiry",
  "signIn",
  "requestPasswordReset",
  "setPassword", // requires a valid session from the email link (checked with getUser)
  "clientSignIn",
  "getCaptchaChallenge",
]);

const dir = path.resolve(__dirname, "../../src/server/actions");

describe("server actions", () => {
  const files = readdirSync(dir).filter((f) => f.endsWith(".ts"));
  it.each(files)("%s: every exported action authorizes", (file) => {
    const src = readFileSync(path.join(dir, file), "utf8");
    expect(src.startsWith('"use server";'), `${file} must start with "use server"`).toBe(true);
    const exports = [...src.matchAll(/export async function (\w+)\s*\(/g)].map((m) => ({ name: m[1]!, index: m.index! }));
    expect(src).not.toMatch(/export (const|function |let |class )/); // only async functions may be exported
    for (let i = 0; i < exports.length; i++) {
      const { name, index } = exports[i]!;
      if (PUBLIC_ACTIONS.has(name)) continue;
      const body = src.slice(index, exports[i + 1]?.index ?? src.length);
      expect(/await authorize(Client)?\(/.test(body) || /\bsave\(\s*await authorize\(/.test(body) || /return runAction\(\(\) => save\w*\(/.test(body), `${file}: ${name} must call authorize()/authorizeClient()`).toBe(true);
    }
  });
});
