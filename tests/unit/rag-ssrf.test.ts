import { describe, expect, it } from "vitest";

import { validateCrawlerUrl } from "@/server/knowledge/ssrf";

describe("RAG SSRF Protection", () => {
  it("blocks cloud metadata service IP (169.254.169.254)", () => {
    const res = validateCrawlerUrl("http://169.254.169.254/latest/meta-data/");
    expect(res.ok).toBe(false);
  });

  it("blocks private IPv4 ranges (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16)", () => {
    expect(validateCrawlerUrl("http://10.0.0.1/admin").ok).toBe(false);
    expect(validateCrawlerUrl("http://172.16.0.5/api").ok).toBe(false);
    expect(validateCrawlerUrl("http://192.168.1.1/router").ok).toBe(false);
  });

  it("blocks non-http protocols like file:, gopher:, ftp:", () => {
    expect(validateCrawlerUrl("file:///etc/passwd").ok).toBe(false);
    expect(validateCrawlerUrl("gopher://evil.com").ok).toBe(false);
    expect(validateCrawlerUrl("ftp://files.org").ok).toBe(false);
  });

  it("blocks malformed URLs", () => {
    expect(validateCrawlerUrl("not-a-valid-url").ok).toBe(false);
  });

  it("allows valid public HTTPS websites", () => {
    const res = validateCrawlerUrl("https://aiwithhamad.com/services");
    expect(res.ok).toBe(true);
    expect(res.url?.hostname).toBe("aiwithhamad.com");
  });
});
