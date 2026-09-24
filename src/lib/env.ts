import { z } from "zod";

/**
 * Environment access. Public values (NEXT_PUBLIC_*) are inlined at build time
 * and are safe in client bundles. Server secrets are read through
 * `serverEnv()` in modules that import "server-only".
 */

const trimmed = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() !== "" ? v.trim() : undefined));

function normalizeSiteUrl(raw: string | undefined): string {
  const fallback = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000";
  const value = raw ?? fallback;
  try {
    const url = new URL(value);
    return url.origin;
  } catch {
    return fallback;
  }
}

export const publicEnv = {
  siteUrl: normalizeSiteUrl(trimmed.parse(process.env.NEXT_PUBLIC_SITE_URL)),
  supabaseUrl: trimmed.parse(process.env.NEXT_PUBLIC_SUPABASE_URL),
  supabasePublishableKey:
    trimmed.parse(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) ??
    trimmed.parse(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  /** Explicit opt-in for search indexing; anything else => noindex (protects previews). */
  allowIndexing: process.env.NEXT_PUBLIC_ALLOW_INDEXING === "true",
} as const;

export function isSupabaseConfigured(): boolean {
  return Boolean(publicEnv.supabaseUrl && publicEnv.supabasePublishableKey);
}

const serverSchema = z.object({
  DATABASE_URL: trimmed,
  SUPABASE_SECRET_KEY: trimmed,
  SUPABASE_SERVICE_ROLE_KEY: trimmed,
  RESEND_API_KEY: trimmed,
  EMAIL_FROM: trimmed,
  INQUIRY_NOTIFICATION_EMAIL: trimmed,
  IP_HASH_SALT: trimmed,
});

export type ServerEnv = {
  databaseUrl?: string;
  supabaseSecretKey?: string;
  resendApiKey?: string;
  emailFrom?: string;
  inquiryNotificationEmail?: string;
  ipHashSalt: string;
};

let cached: ServerEnv | null = null;

export function serverEnv(): ServerEnv {
  if (cached) return cached;
  const parsed = serverSchema.parse(process.env);
  const ipHashSalt = parsed.IP_HASH_SALT ?? "";
  if (process.env.NODE_ENV === "production" && process.env.VERCEL_ENV === "production") {
    const missing: string[] = [];
    if (!parsed.DATABASE_URL) missing.push("DATABASE_URL");
    if (!publicEnv.supabaseUrl) missing.push("NEXT_PUBLIC_SUPABASE_URL");
    if (!publicEnv.supabasePublishableKey) missing.push("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
    if (!ipHashSalt) missing.push("IP_HASH_SALT");
    if (missing.length) {
      throw new Error(`Missing required production environment variables: ${missing.join(", ")}`);
    }
  }
  cached = {
    databaseUrl: parsed.DATABASE_URL,
    supabaseSecretKey: parsed.SUPABASE_SECRET_KEY ?? parsed.SUPABASE_SERVICE_ROLE_KEY,
    resendApiKey: parsed.RESEND_API_KEY,
    emailFrom: parsed.EMAIL_FROM,
    inquiryNotificationEmail: parsed.INQUIRY_NOTIFICATION_EMAIL,
    ipHashSalt: ipHashSalt || "local-development-salt",
  };
  return cached;
}
