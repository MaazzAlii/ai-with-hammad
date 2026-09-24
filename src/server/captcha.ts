import "server-only";

import { createHmac, randomInt, randomUUID, timingSafeEqual } from "node:crypto";

import { serverEnv } from "@/lib/env";
import { rateLimit } from "@/lib/rate-limit";

/**
 * Human verification for public forms and logins.
 *
 * - If TURNSTILE_SECRET_KEY + NEXT_PUBLIC_TURNSTILE_SITE_KEY are set, Cloudflare Turnstile is used.
 * - Otherwise a self-hosted arithmetic challenge: the answer never leaves the server; the client
 *   gets `nonce.expiry.hmac(nonce.expiry.answer)`. Tokens expire after 10 minutes and are single-use.
 */
const TTL_MS = 10 * 60 * 1000;

export type CaptchaInput = { captchaToken?: unknown; captchaAnswer?: unknown; turnstileToken?: unknown };

export function turnstileEnabled() {
  return Boolean(process.env.TURNSTILE_SECRET_KEY && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
}

function secret() {
  const env = serverEnv();
  return process.env.CAPTCHA_SECRET || env.ipHashSalt;
}

function sign(nonce: string, exp: number, answer: number) {
  return createHmac("sha256", secret()).update(`${nonce}.${exp}.${answer}`).digest("base64url");
}

export function createChallenge(now = Date.now()) {
  const a = randomInt(2, 10);
  const b = randomInt(1, 10);
  const plus = randomInt(0, 2) === 0;
  const [x, y] = plus ? [a, b] : [Math.max(a, b), Math.min(a, b)];
  const answer = plus ? x + y : x - y;
  const nonce = randomUUID();
  const exp = now + TTL_MS;
  return { question: `What is ${x} ${plus ? "+" : "−"} ${y}?`, token: `${nonce}.${exp}.${sign(nonce, exp, answer)}` };
}

/** Pure check (no replay protection) — exported for unit tests. */
export function checkChallenge(token: string, answerRaw: string, now = Date.now()): { ok: boolean; nonce?: string } {
  const [nonce, expRaw, sig] = token.split(".");
  const exp = Number(expRaw);
  const answer = Number.parseInt(answerRaw.trim(), 10);
  if (!nonce || !sig || !Number.isFinite(exp) || !Number.isFinite(answer)) return { ok: false };
  if (now > exp) return { ok: false };
  const expected = Buffer.from(sign(nonce, exp, answer));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return { ok: false };
  return { ok: true, nonce };
}

export async function verifyCaptcha(input: CaptchaInput, ip?: string): Promise<boolean> {
  if (turnstileEnabled()) {
    const token = typeof input.turnstileToken === "string" ? input.turnstileToken : "";
    if (!token || token.length > 4096) return false;
    try {
      const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST",
        body: new URLSearchParams({ secret: process.env.TURNSTILE_SECRET_KEY!, response: token, ...(ip && ip !== "unknown" ? { remoteip: ip } : {}) }),
        signal: AbortSignal.timeout(8000),
      });
      const data = (await res.json()) as { success?: boolean };
      return data.success === true;
    } catch {
      return false;
    }
  }
  const token = typeof input.captchaToken === "string" ? input.captchaToken.slice(0, 300) : "";
  const answer = typeof input.captchaAnswer === "string" ? input.captchaAnswer.slice(0, 10) : "";
  const result = checkChallenge(token, answer);
  if (!result.ok) return false;
  // Single use: the first verification of a nonce consumes it.
  return rateLimit(`captcha:${result.nonce}`, 1, 3600);
}

export const CAPTCHA_ERROR = "Please answer the security question correctly.";
