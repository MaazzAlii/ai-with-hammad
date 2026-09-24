import localFont from "next/font/local";

/**
 * Self-hosted variable fonts (from @fontsource-variable packages) via next/font:
 * no runtime requests to Google, no render-blocking CSS, automatic preloading.
 */
export const fontDisplay = localFont({
  src: "../../node_modules/@fontsource-variable/sora/files/sora-latin-wght-normal.woff2",
  variable: "--font-display",
  weight: "100 800",
  display: "swap",
  fallback: ["Segoe UI", "system-ui", "sans-serif"],
});

export const fontBody = localFont({
  src: "../../node_modules/@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2",
  variable: "--font-body",
  weight: "200 800",
  display: "swap",
  fallback: ["Segoe UI", "system-ui", "sans-serif"],
});

export const fontMono = localFont({
  src: "../../node_modules/@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2",
  variable: "--font-mono",
  weight: "100 800",
  display: "swap",
  preload: false,
  fallback: ["Consolas", "ui-monospace", "monospace"],
});
