import "server-only";

import { createHash } from "node:crypto";

import { headers } from "next/headers";

import { serverEnv } from "@/lib/env";

/** Client IP from the platform proxy headers (Vercel sets x-forwarded-for / x-real-ip). */
export async function clientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return h.get("x-real-ip") ?? "unknown";
}

/** Salted one-way hash so raw IPs are never stored. */
export function hashIp(ip: string): string {
  return createHash("sha256").update(`${serverEnv().ipHashSalt}:${ip}`).digest("hex").slice(0, 32);
}

export async function requestMeta() {
  const h = await headers();
  const ip = await clientIp();
  return {
    ipHash: hashIp(ip),
    userAgent: (h.get("user-agent") ?? "").slice(0, 300),
  };
}
