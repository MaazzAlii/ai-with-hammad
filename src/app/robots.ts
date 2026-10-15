import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  // Temporary: allow all bots to access the site for logo feedback
  return {
    rules: [{ userAgent: "*", disallow: [""] }],
  };
}
