import type { Metadata, Viewport } from "next";

import { publicEnv } from "@/lib/env";
import { getPublicSettings } from "@/server/dal/public/site";

import { fontMono, fontSans } from "./fonts";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const { general, seo } = await getPublicSettings();
  return {
    metadataBase: new URL(publicEnv.siteUrl),
    title: { default: seo.defaultTitle || general.siteName, template: `%s · ${general.siteName}` },
    description: seo.defaultDescription || general.description,
    applicationName: general.siteName,
    openGraph: { siteName: general.siteName, locale: "en_US", type: "website" },
    twitter: { card: "summary_large_image", ...(seo.twitterHandle ? { site: seo.twitterHandle } : {}) },
    // Only production deployments with NEXT_PUBLIC_ALLOW_INDEXING=true may be indexed.
    robots: publicEnv.allowIndexing ? { index: true, follow: true } : { index: false, follow: false },
    formatDetection: { telephone: false, email: false, address: false },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2f3f6" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0c0f" },
  ],
  colorScheme: "light dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fontSans.variable} ${fontMono.variable}`}>
      <body className="min-h-dvh overflow-x-clip">
        <div aria-hidden className="ambient" />
        {children}
      </body>
    </html>
  );
}
