import type { MetadataRoute } from "next";

import { getPublicSettings } from "@/server/dal/public/site";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const { general } = await getPublicSettings();
  return {
    name: general.siteName,
    short_name: general.siteName,
    description: general.tagline,
    start_url: "/",
    display: "standalone",
    background_color: "#05090e",
    theme_color: "#05090e",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
