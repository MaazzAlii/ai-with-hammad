import type { Metadata, Viewport } from "next";
import Script from "next/script";

import { publicEnv } from "@/lib/env";
import { THEME_BOOT_SCRIPT } from "@/lib/theme";
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
  // Light by default; the theme toggle rewrites this meta tag when dark mode is chosen.
  themeColor: "#f2f3f6",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fontSans.variable} ${fontMono.variable}`} suppressHydrationWarning>
      <head>
        <Script id="theme-boot" strategy="beforeInteractive">
          {THEME_BOOT_SCRIPT}
        </Script>
      </head>
      <body className="min-h-dvh overflow-x-clip">
        <div aria-hidden className="ambient" />
        {children}
      </body>
    </html>
  );
}
