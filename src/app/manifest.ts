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
    background_color: "#f2f3f6",
    theme_color: "#f2f3f6",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
