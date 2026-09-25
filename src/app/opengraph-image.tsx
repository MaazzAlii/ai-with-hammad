import { ImageResponse } from "next/og";

import { getPublicSettings } from "@/server/dal/public/site";

export const alt = "AI With Hamad";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 3600;

/** Default social preview image (used when a page has no cover image). */
export default async function OpenGraphImage() {
  const { general } = await getPublicSettings();
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "radial-gradient(circle at 12% 0%, rgba(10,108,158,0.22), transparent 55%), radial-gradient(circle at 95% 20%, rgba(14,124,116,0.16), transparent 50%), #f2f3f6",
          color: "#0f1115",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: "#0a6c9e", display: "flex", alignItems: "center", justifyContent: "center", color: "#ffffff", fontSize: 28, fontWeight: 600 }}>
            {general.siteName.replace(/^AI\s+with\s+/i, "").charAt(0).toUpperCase()}
          </div>
          <div style={{ fontSize: 34, fontWeight: 600 }}>{general.siteName}</div>
        </div>
        <div style={{ fontSize: 68, fontWeight: 600, lineHeight: 1.08, letterSpacing: -2, maxWidth: 980 }}>{general.tagline}</div>
        <div style={{ fontSize: 26, color: "#4d5562" }}>AI engineering · Automation · Agentic systems</div>
      </div>
    ),
    size,
  );
}
