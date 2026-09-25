import localFont from "next/font/local";

/**
 * Self-hosted variable fonts (from @fontsource-variable packages) via next/font:
 * no runtime requests, no render-blocking CSS, automatic preloading.
 *
 * Apple devices render the system font (SF Pro) first — see --font-sans in
 * globals.css; Inter is the closest high-quality equivalent everywhere else.
 */
export const fontSans = localFont({
  src: "../../node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2",
  variable: "--font-inter",
  weight: "100 900",
  display: "swap",
  fallback: ["Segoe UI", "system-ui", "sans-serif"],
});

export const fontMono = localFont({
  src: "../../node_modules/@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2",
  variable: "--font-jetbrains",
  weight: "100 800",
  display: "swap",
  preload: false,
  fallback: ["Consolas", "ui-monospace", "monospace"],
});
