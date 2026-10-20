import "server-only";

import { isIP } from "node:net";

import { publicEnv, serverEnv } from "@/lib/env";

const BLOCKED_HOSTS = new Set([
  "169.254.169.254", // AWS/GCP/Azure instance metadata
  "metadata.google.internal",
  "instance-data",
  "localhost.localdomain",
]);

function isPrivateIp(ip: string): boolean {
  // IPv4 checks
  const parts = ip.split(".").map(Number);
  if (parts.length === 4 && parts.every((p) => !isNaN(p) && p >= 0 && p <= 255)) {
    // 0.0.0.0/8 (current network)
    if (parts[0] === 0) return true;
    // 10.0.0.0/8 (private)
    if (parts[0] === 10) return true;
    // 127.0.0.0/8 (loopback)
    if (parts[0] === 127) return true;
    // 169.254.0.0/16 (link-local / cloud metadata)
    if (parts[0] === 169 && parts[1] === 254) return true;
    // 172.16.0.0/12 (private)
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    // 192.168.0.0/16 (private)
    if (parts[0] === 192 && parts[1] === 168) return true;
    // 224.0.0.0/4 (multicast)
    if (parts[0] >= 224 && parts[0] <= 239) return true;
    // 240.0.0.0/4 (reserved)
    if (parts[0] >= 240) return true;
  }

  // IPv6 loopback and private
  const lower = ip.toLowerCase();
  if (lower === "::1" || lower === "::" || lower.startsWith("fe80:") || lower.startsWith("fc00:") || lower.startsWith("fd00:")) {
    return true;
  }

  return false;
}

/**
 * Validates a target URL against SSRF attacks before crawling/fetching.
 * Allows localhost only when explicitly configured as the source URL in development.
 */
export function validateCrawlerUrl(targetUrl: string): { ok: boolean; reason?: string; url?: URL } {
  let parsed: URL;
  try {
    parsed = new URL(targetUrl);
  } catch {
    return { ok: false, reason: "Invalid URL format" };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, reason: "Only HTTP and HTTPS protocols are allowed" };
  }

  const hostname = parsed.hostname.toLowerCase();

  if (BLOCKED_HOSTS.has(hostname)) {
    return { ok: false, reason: "Forbidden host or cloud metadata address" };
  }

  // Check if target matches configured knowledgeSourceUrl or siteUrl
  const allowedSource = serverEnv().knowledgeSourceUrl || publicEnv.siteUrl;
  let allowedHost = "";
  try {
    allowedHost = new URL(allowedSource).hostname.toLowerCase();
  } catch {
    allowedHost = "localhost";
  }

  const isConfiguredSource = hostname === allowedHost;
  const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";

  // In production, block localhost/private IPs unless explicitly configured as the knowledgeSourceUrl
  if (process.env.NODE_ENV === "production" && isLocalhost && !isConfiguredSource) {
    return { ok: false, reason: "Localhost access is disabled in production" };
  }

  if (isIP(hostname)) {
    if (isPrivateIp(hostname) && !isConfiguredSource) {
      return { ok: false, reason: "Private IP address access is forbidden" };
    }
  }

  return { ok: true, url: parsed };
}

/**
 * Safe fetch wrapper that enforces timeout and max response size.
 */
export async function safeFetch(url: string, options: RequestInit = {}, maxBytes = 5 * 1024 * 1024): Promise<Response> {
  const check = validateCrawlerUrl(url);
  if (!check.ok) {
    throw new Error(`SSRF blocked: ${check.reason}`);
  }

  const timeoutSignal = AbortSignal.timeout(15_000);
  const signal = options.signal ? AbortSignal.any([options.signal, timeoutSignal]) : timeoutSignal;

  const res = await fetch(url, {
    ...options,
    signal,
    headers: {
      "User-Agent": "AIWithHamadBot/1.0 (+https://aiwithhamad.com)",
      Accept: "text/html,application/xhtml+xml,text/plain",
      ...options.headers,
    },
  });

  const contentLength = Number(res.headers.get("content-length"));
  if (contentLength && contentLength > maxBytes) {
    throw new Error(`Response exceeds maximum size limit of ${maxBytes} bytes`);
  }

  return res;
}
