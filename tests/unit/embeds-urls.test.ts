import { describe, expect, it } from "vitest";

import { parseEmbed, parseVideoEmbed, parseVimeo, parseYouTube } from "@/lib/embeds";
import { safeHref, safeHttpUrl, safeInternalPath, safeNextPath } from "@/lib/url-safety";

describe("embeds", () => {
  it("parses YouTube variants into privacy-enhanced embeds", () => {
    for (const u of ["https://www.youtube.com/watch?v=dQw4w9WgXcQ", "https://youtu.be/dQw4w9WgXcQ", "https://youtube.com/shorts/dQw4w9WgXcQ", "https://m.youtube.com/embed/dQw4w9WgXcQ"]) {
      const e = parseYouTube(u);
      expect(e?.id, u).toBe("dQw4w9WgXcQ");
      expect(e?.embedUrl.startsWith("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ")).toBe(true);
    }
    expect(parseYouTube("https://youtube.com/shorts/dQw4w9WgXcQ")?.aspect).toBe("portrait");
  });

  it("rejects look-alike hosts and injection attempts", () => {
    expect(parseYouTube("https://youtube.com.evil.com/watch?v=dQw4w9WgXcQ")).toBeNull();
    expect(parseYouTube("https://www.youtube.com/watch?v=abc\"onload=alert(1)")).toBeNull();
    expect(parseEmbed("javascript:alert(1)")).toBeNull();
    expect(parseEmbed("<iframe src=https://evil.com>")).toBeNull();
    expect(parseVideoEmbed("https://www.tiktok.com/@x/video/7234567890123456789")).toBeNull();
  });

  it("parses Vimeo (incl. unlisted hash) and social embeds", () => {
    expect(parseVimeo("https://vimeo.com/123456789")?.embedUrl).toBe("https://player.vimeo.com/video/123456789?dnt=1");
    expect(parseVimeo("https://vimeo.com/123456789/abcdef1234")?.embedUrl).toContain("h=abcdef1234");
    expect(parseEmbed("https://www.tiktok.com/@creator/video/7234567890123456789")?.provider).toBe("tiktok");
    expect(parseEmbed("https://www.instagram.com/reel/Cabc123XYZ/")?.embedUrl).toBe("https://www.instagram.com/reel/Cabc123XYZ/embed");
    expect(parseEmbed("https://www.linkedin.com/feed/update/urn:li:activity:7123456789012345678/")?.provider).toBe("linkedin");
  });
});

describe("url safety", () => {
  it("safeHttpUrl", () => {
    expect(safeHttpUrl("https://example.com/a")).toBe("https://example.com/a");
    expect(safeHttpUrl("http://example.com", { httpsOnly: true })).toBeNull();
    expect(safeHttpUrl("javascript:alert(1)")).toBeNull();
    expect(safeHttpUrl("data:text/html,x")).toBeNull();
    expect(safeHttpUrl("https://u:p@example.com")).toBeNull();
  });
  it("internal paths and post-login redirects", () => {
    expect(safeInternalPath("/projects")).toBe("/projects");
    expect(safeInternalPath("//evil.com")).toBeNull();
    expect(safeInternalPath("/\\evil.com")).toBeNull();
    expect(safeHref("https://x.io")).toBe("https://x.io/");
    expect(safeNextPath("/admin/projects")).toBe("/admin/projects");
    expect(safeNextPath("https://evil.com")).toBe("/admin");
    expect(safeNextPath("/projects")).toBe("/admin");
    expect(safeNextPath("//evil.com/admin")).toBe("/admin");
  });
});
