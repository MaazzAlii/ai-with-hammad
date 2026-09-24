import { describe, expect, it } from "vitest";

import { formDataToObject } from "@/lib/form-data";
import { contentItemSchema, navItemSchema, projectSchema, ratesSchema, serviceSchema, teamMemberSchema } from "@/lib/validation/admin";
import { contactInquirySchema, looksLikeSpam, sponsorshipInquirySchema } from "@/lib/validation/inquiry";

describe("contact inquiry schema", () => {
  const valid = { name: "Ada Lovelace", email: " ADA@Example.com ", message: "We want to automate invoice processing end to end." };

  it("accepts a valid inquiry and normalizes email", () => {
    const r = contactInquirySchema.parse(valid);
    expect(r.email).toBe("ada@example.com");
    expect(r.company).toBe("");
  });

  it("rejects bad email, short message and oversized fields", () => {
    expect(contactInquirySchema.safeParse({ ...valid, email: "nope" }).success).toBe(false);
    expect(contactInquirySchema.safeParse({ ...valid, message: "hi" }).success).toBe(false);
    expect(contactInquirySchema.safeParse({ ...valid, name: "x".repeat(121) }).success).toBe(false);
    expect(contactInquirySchema.safeParse({ ...valid, phone: "<script>" }).success).toBe(false);
    expect(contactInquirySchema.safeParse({ ...valid, serviceId: "not-a-uuid" }).success).toBe(false);
  });

  it("flags link-stuffed spam", () => {
    expect(looksLikeSpam("see https://a https://b https://c https://d https://e https://f")).toBe(true);
    expect(looksLikeSpam("our site is https://example.com")).toBe(false);
  });
});

describe("sponsorship inquiry schema", () => {
  it("validates platforms against the enum and website format", () => {
    const base = { name: "Brand Person", email: "b@brand.io", company: "Brand", message: "We would like to sponsor a tutorial video." };
    expect(sponsorshipInquirySchema.safeParse({ ...base, platforms: ["youtube", "tiktok"] }).success).toBe(true);
    expect(sponsorshipInquirySchema.safeParse({ ...base, platforms: ["myspace"] }).success).toBe(false);
    expect(sponsorshipInquirySchema.safeParse({ ...base, website: "javascript:alert(1)" }).success).toBe(false);
  });
});

describe("admin schemas", () => {
  it("project: slug rules, URL safety, JSON repeaters and media rules", () => {
    const base = { title: "P", slug: "valid-slug" };
    expect(projectSchema.safeParse({ ...base, slug: "Bad Slug" }).success).toBe(false);
    expect(projectSchema.safeParse({ ...base, projectUrl: "javascript:alert(1)" }).success).toBe(false);
    expect(projectSchema.safeParse({ ...base, projectUrl: "https://user:pw@evil.com" }).success).toBe(false);
    const ok = projectSchema.parse({ ...base, isPublished: "on", technologies: "n8n, OpenAI\nPostgres", metrics: JSON.stringify([{ label: "Time saved", value: "10h" }]) });
    expect(ok.isPublished).toBe(true);
    expect(ok.isPinned).toBe(false);
    expect(ok.technologies).toEqual(["n8n", "OpenAI", "Postgres"]);
    expect(ok.metrics).toHaveLength(1);
    // youtube item needs a URL; image item needs an asset
    expect(projectSchema.safeParse({ ...base, media: JSON.stringify([{ type: "youtube" }]) }).success).toBe(false);
    expect(projectSchema.safeParse({ ...base, media: JSON.stringify([{ type: "image" }]) }).success).toBe(false);
    expect(projectSchema.safeParse({ ...base, media: JSON.stringify([{ type: "youtube", externalUrl: "http://youtube.com/watch?v=x" }]) }).success).toBe(false);
    expect(projectSchema.safeParse({ ...base, media: "{not json" }).success).toBe(false);
  });

  it("service/team/content", () => {
    expect(serviceSchema.parse({ title: "S", slug: "s", features: "" }).features).toEqual([]);
    expect(teamMemberSchema.safeParse({ name: "N", slug: "n", links: JSON.stringify([{ platform: "x", url: "ftp://x" }]) }).success).toBe(false);
    expect(contentItemSchema.safeParse({ title: "C", slug: "c", platform: "youtube", url: "http://insecure.example" }).success).toBe(false);
    expect(contentItemSchema.safeParse({ title: "C", slug: "c", platform: "youtube", url: "https://youtu.be/dQw4w9WgXcQ" }).success).toBe(true);
  });

  it("rates: minimum cannot exceed standard", () => {
    expect(ratesSchema.safeParse({ standardRate: "1000", minimumRate: "2000" }).success).toBe(false);
    expect(ratesSchema.parse({ standardRate: "1000", minimumRate: "", currency: "eur" })).toMatchObject({ standardRate: 1000, minimumRate: null, currency: "EUR" });
  });

  it("navigation hrefs must be internal paths or https", () => {
    for (const bad of ["//evil.com", "javascript:alert(1)", "http://x.com", "/a b"]) {
      expect(navItemSchema.safeParse({ location: "header", label: "L", href: bad }).success, bad).toBe(false);
    }
    expect(navItemSchema.safeParse({ location: "header", label: "L", href: "/projects" }).success).toBe(true);
  });
});

describe("formDataToObject", () => {
  it("handles repeated keys, [] suffix and ignores files", () => {
    const fd = new FormData();
    fd.append("a", "1");
    fd.append("platforms[]", "youtube");
    fd.append("tags", "x");
    fd.append("tags", "y");
    fd.append("file", new Blob(["x"]));
    fd.append("$ACTION_ID_123", "");
    expect(formDataToObject(fd)).toEqual({ a: "1", platforms: ["youtube"], tags: ["x", "y"], file: "" });
  });
});
