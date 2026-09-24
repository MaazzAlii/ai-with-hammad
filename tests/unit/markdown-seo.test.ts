import { describe, expect, it } from "vitest";

import { breadcrumbLd, serializeJsonLd } from "@/lib/jsonld";
import { markdownToText, renderMarkdown } from "@/lib/markdown";
import { absoluteUrl, buildMetadata } from "@/lib/seo";
import { parseSettings } from "@/lib/settings";
import { slugify, truncate } from "@/lib/utils";

describe("markdown renderer", () => {
  it("renders the supported subset", () => {
    const html = renderMarkdown("## Title\n\nSome **bold** and *em* with `code`.\n\n- a\n- b\n\n1. one\n2. two\n\n[link](https://example.com)");
    expect(html).toContain("<h2>Title</h2>");
    expect(html).toContain("<strong>bold</strong>");
    expect(html).toContain("<em>em</em>");
    expect(html).toContain("<ul><li>a</li><li>b</li></ul>");
    expect(html).toContain("<ol><li>one</li><li>two</li></ol>");
    expect(html).toContain('<a href="https://example.com/" rel="noopener noreferrer" target="_blank">link</a>');
  });

  it("escapes HTML and neutralizes dangerous links", () => {
    const html = renderMarkdown('<script>alert(1)</script> <img src=x onerror=alert(1)> [x](javascript:alert(1)) [y](data:text/html,1) [z]("onmouseover=alert(1))');
    expect(html).not.toMatch(/<script|<img|javascript:|data:|onmouseover="/i);
    expect(html).toContain("&lt;script&gt;");
  });

  it("markdownToText strips syntax", () => {
    expect(markdownToText("## Hi **there** [link](https://x)")).toBe("Hi there link");
  });
});

describe("JSON-LD", () => {
  it("cannot break out of the script tag", () => {
    const out = serializeJsonLd({ name: "</script><script>alert(1)</script>" });
    expect(out).not.toContain("</script>");
    expect(JSON.parse(out).name).toBe("</script><script>alert(1)</script>");
  });
  it("builds absolute breadcrumb URLs", () => {
    const ld = breadcrumbLd([{ name: "Home", path: "/" }, { name: "Projects", path: "/projects" }]);
    expect((ld.itemListElement as { item: string }[])[1]!.item).toBe(absoluteUrl("/projects"));
  });
});

describe("metadata", () => {
  it("sets canonical, OG and truncates description", () => {
    const m = buildMetadata({ title: "T", description: "x ".repeat(200), path: "/a" });
    expect(m.alternates?.canonical).toBe(absoluteUrl("/a"));
    expect(String(m.description).length).toBeLessThanOrEqual(160);
    expect(m.openGraph?.url).toBe(absoluteUrl("/a"));
  });
});

describe("settings parsing", () => {
  it("falls back per-field on invalid stored values", () => {
    const s = parseSettings("general", { siteName: "X", contactEmail: "not-an-email" });
    expect(s.siteName).toBe("X");
    expect(s.contactEmail).toBe("");
    expect(parseSettings("home", null).heroTitle.length).toBeGreaterThan(0);
  });
});

describe("utils", () => {
  it("slugify and truncate", () => {
    expect(slugify("  Héllo, World! AI  ")).toBe("hello-world-ai");
    expect(truncate("one two three four", 10)).toBe("one two…");
  });
});
