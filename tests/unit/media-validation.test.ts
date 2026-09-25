import { describe, expect, it } from "vitest";

import { BUCKETS, MB } from "@/lib/media/buckets";
import { buildObjectPath, extensionOf, isValidObjectPath, kindFromMime, validateUpload } from "@/lib/media/validation";

const ok = { canUploadSiteAssets: false };

describe("validateUpload", () => {
  it("accepts a normal image", () => {
    expect(validateUpload({ bucket: "project-images", filename: "cover.JPG", mimeType: "image/jpeg", size: 200_000, width: 1600, height: 900 }, ok)).toEqual([]);
  });

  it("rejects executables, HTML and double extensions", () => {
    expect(validateUpload({ bucket: "media-library", filename: "run.exe", mimeType: "application/octet-stream", size: 10 }, ok).length).toBeGreaterThan(0);
    expect(validateUpload({ bucket: "media-library", filename: "page.html", mimeType: "text/html", size: 10 }, ok).length).toBeGreaterThan(0);
    expect(validateUpload({ bucket: "media-library", filename: "shell.php.jpg", mimeType: "image/jpeg", size: 10 }, ok)).toContain("File name contains a blocked extension.");
  });

  it("requires extension to match MIME type", () => {
    expect(validateUpload({ bucket: "media-library", filename: "a.png", mimeType: "image/jpeg", size: 10 }, ok).join()).toMatch(/does not match/);
  });

  it("enforces bucket MIME allow-list and size", () => {
    expect(validateUpload({ bucket: "team-images", filename: "a.mp4", mimeType: "video/mp4", size: 10 }, ok).join()).toMatch(/not allowed/);
    expect(validateUpload({ bucket: "team-images", filename: "a.png", mimeType: "image/png", size: BUCKETS["team-images"].maxBytes + 1 }, ok).join()).toMatch(/larger/);
    expect(validateUpload({ bucket: "team-images", filename: "a.png", mimeType: "image/png", size: 0 }, ok)).toContain("File is empty.");
  });

  it("restricts SVG/site-assets to settings managers", () => {
    const svg = { bucket: "site-assets" as const, filename: "logo.svg", mimeType: "image/svg+xml", size: 1000 };
    expect(validateUpload(svg, ok).join()).toMatch(/permission/);
    expect(validateUpload(svg, { canUploadSiteAssets: true })).toEqual([]);
    expect(validateUpload({ ...svg, bucket: "media-library" }, { canUploadSiteAssets: true }).length).toBeGreaterThan(0);
  });

  it("checks dimensions and video duration", () => {
    expect(validateUpload({ bucket: "project-images", filename: "a.png", mimeType: "image/png", size: 10, width: 50000, height: 10 }, ok).length).toBe(1);
    expect(validateUpload({ bucket: "project-videos", filename: "a.mp4", mimeType: "video/mp4", size: 5 * MB, durationSeconds: 99999 }, ok).length).toBe(1);
  });
});

describe("object paths", () => {
  it("builds safe, non-user-controlled paths", () => {
    const p = buildObjectPath("../../My Photo (1).PNG", "123e4567-e89b-12d3-a456-426614174000", new Date("2026-02-03T00:00:00Z"));
    expect(p).toBe("2026/02/123e4567-e89b-12d3-a456-426614174000-my-photo-1.png");
    expect(isValidObjectPath(p)).toBe(true);
    expect(isValidObjectPath("../etc/passwd")).toBe(false);
    expect(isValidObjectPath("2026/02/x/../../a.png")).toBe(false);
  });
  it("helpers", () => {
    expect(extensionOf("a.b.C")).toBe("c");
    expect(extensionOf(".bashrc")).toBe("");
    expect(kindFromMime("application/pdf")).toBe("document");
  });
});
