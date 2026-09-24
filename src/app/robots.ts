import type { MetadataRoute } from "next";

import { publicEnv } from "@/lib/env";
import { absoluteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  if (!publicEnv.allowIndexing) {
    // Preview / staging deployments: keep everything out of search engines.
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/login", "/auth/", "/api/"] }],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: publicEnv.siteUrl,
  };
}
