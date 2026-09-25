import { describe, expect, it } from "vitest";

import { whatsappLink } from "@/lib/whatsapp";
import { checkChallenge, createChallenge } from "@/server/captcha";

function solve(question: string) {
  const m = question.match(/What is (\d+) ([+−]) (\d+)\?/)!;
  return String(m[2] === "+" ? Number(m[1]) + Number(m[3]) : Number(m[1]) - Number(m[3]));
}

describe("built-in captcha", () => {
  it("accepts the right answer and rejects wrong ones", () => {
    const c = createChallenge();
    expect(checkChallenge(c.token, solve(c.question)).ok).toBe(true);
    expect(checkChallenge(c.token, String(Number(solve(c.question)) + 1)).ok).toBe(false);
    expect(checkChallenge(c.token, "").ok).toBe(false);
  });
  it("never includes the answer in the token and rejects tampering/expiry", () => {
    const now = Date.now();
    const c = createChallenge(now);
    const answer = solve(c.question);
    const [nonce, exp, sig] = c.token.split(".");
    expect(checkChallenge(`${nonce}.${Number(exp) + 60_000}.${sig}`, answer, now).ok).toBe(false);
    expect(checkChallenge(c.token, answer, now + 11 * 60_000).ok).toBe(false);
    expect(checkChallenge("garbage", answer).ok).toBe(false);
    expect(c.question).toMatch(/^What is \d+ [+−] \d+\?$/);
  });
});

describe("whatsapp links", () => {
  it("normalizes numbers and encodes the message", () => {
    expect(whatsappLink("+92 300 123-4567", "Hi there & hello")).toBe("https://wa.me/923001234567?text=Hi%20there%20%26%20hello");
    expect(whatsappLink("")).toBeNull();
    expect(whatsappLink("123")).toBeNull();
  });
});
