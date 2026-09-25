"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ background: "#05090e", color: "#e8f1f2", fontFamily: "system-ui, sans-serif", display: "grid", placeItems: "center", minHeight: "100dvh", margin: 0 }}>
        <div style={{ textAlign: "center", padding: 24 }}>
          <h1>Something went wrong</h1>
          <p style={{ color: "#9bb1ba" }}>Please refresh the page.</p>
          <button onClick={reset} style={{ marginTop: 16, padding: "10px 18px", borderRadius: 12, border: 0, background: "#22d3ee", color: "#03181c", fontWeight: 600, cursor: "pointer" }}>
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
