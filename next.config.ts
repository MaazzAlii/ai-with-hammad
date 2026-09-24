import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL) : null;
const isDev = process.env.NODE_ENV !== "production";
/** Local E2E stack serves Storage from 127.0.0.1; never enable in real deployments. */
const allowLocalImages = process.env.LOCAL_SUPABASE_STACK === "true";

const supabaseOrigin = supabaseUrl ? supabaseUrl.origin : "";
const supabaseWs = supabaseUrl ? `wss://${supabaseUrl.host}` : "";

const csp = [
  "default-src 'self'",
  // Next.js inlines bootstrap scripts; nonces would force dynamic rendering of every page (no ISR).
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://va.vercel-scripts.com`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${supabaseOrigin} https://i.ytimg.com https://i.vimeocdn.com`,
  `media-src 'self' blob: ${supabaseOrigin}`,
  "font-src 'self'",
  `connect-src 'self' ${supabaseOrigin} ${supabaseWs} https://vitals.vercel-insights.com https://va.vercel-scripts.com`,
  "frame-src https://www.youtube-nocookie.com https://player.vimeo.com https://www.tiktok.com https://www.instagram.com https://www.facebook.com https://www.linkedin.com",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  ...(isDev || allowLocalImages ? [] : ["upgrade-insecure-requests"]),
]
  .join("; ")
  .replace(/\s{2,}/g, " ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      ...(supabaseUrl
        ? [
            {
              protocol: supabaseUrl.protocol.replace(":", "") as "http" | "https",
              hostname: supabaseUrl.hostname,
              port: supabaseUrl.port,
              pathname: "/storage/v1/object/public/**",
            },
          ]
        : []),
      { protocol: "https", hostname: "i.ytimg.com", pathname: "/vi/**" },
    ],
    dangerouslyAllowLocalIP: allowLocalImages,
  },
  experimental: {
    serverActions: { bodySizeLimit: "1mb" },
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/admin/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
      { source: "/login", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
    ];
  },
};

export default nextConfig;
