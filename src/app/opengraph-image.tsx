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
          background: "radial-gradient(circle at 80% 0%, rgba(34,211,238,0.25), transparent 55%), #05090e",
          color: "#e8f1f2",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, border: "2px solid rgba(34,211,238,0.5)", display: "flex", alignItems: "center", justifyContent: "center", color: "#22d3ee", fontSize: 28 }}>
            {general.siteName.replace(/^AI\s+with\s+/i, "").charAt(0).toUpperCase()}
          </div>
          <div style={{ fontSize: 34, fontWeight: 700 }}>{general.siteName}</div>
        </div>
        <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 1.1, maxWidth: 950 }}>{general.tagline}</div>
        <div style={{ fontSize: 26, color: "#9bb1ba" }}>AI engineering · Automation · Agentic systems</div>
      </div>
    ),
    size,
  );
}
