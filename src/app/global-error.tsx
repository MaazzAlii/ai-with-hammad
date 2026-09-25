"use client";

/**
 * Last-resort boundary: replaces the root layout, so no stylesheet is guaranteed.
 * Inline styles mirror the light tokens; the system font matches the design system.
 */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          background: "#f2f3f6",
          color: "#0f1115",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
          display: "grid",
          placeItems: "center",
          minHeight: "100dvh",
          margin: 0,
        }}
      >
        <div style={{ textAlign: "center", padding: 24, maxWidth: 360 }}>
          <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.02em", margin: 0 }}>Something went wrong</h1>
          <p style={{ color: "#4d5562", marginTop: 8 }}>Please try again. If it keeps happening, refresh the page.</p>
          <button
            onClick={reset}
            style={{ marginTop: 20, height: 44, padding: "0 22px", borderRadius: 999, border: 0, background: "#0a6c9e", color: "#fff", fontSize: 15, fontWeight: 500, cursor: "pointer" }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
