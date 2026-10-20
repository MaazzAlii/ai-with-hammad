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
  MISTRAL_API_KEY: trimmed,
  MISTRAL_MODEL: trimmed,
  MISTRAL_CHAT_MODEL: trimmed,
  MISTRAL_EMBEDDING_MODEL: trimmed,
  XAI_API_KEY: trimmed,
  XAI_CHAT_MODEL: trimmed,
  AI_PROVIDER: trimmed,
  AI_FALLBACK_PROVIDER: trimmed,
  AI_PROVIDER_PRIORITY: trimmed,
  KNOWLEDGE_SOURCE_URL: trimmed,
  VECTOR_DB_TYPE: trimmed,
  RAG_TOP_K: trimmed,
  RAG_RELEVANCE_THRESHOLD: trimmed,
  CHAT_RATE_LIMIT: trimmed,
});

export type ServerEnv = {
  databaseUrl?: string;
  supabaseSecretKey?: string;
  resendApiKey?: string;
  emailFrom?: string;
  inquiryNotificationEmail?: string;
  ipHashSalt: string;
  /** Mistral key for the site assistant (chat + voice). Unset = assistant hidden. */
  mistralApiKey?: string;
  mistralModel: string;
  mistralChatModel: string;
  mistralEmbeddingModel: string;
  xaiApiKey?: string;
  xaiChatModel: string;
  aiProvider: "mistral" | "xai";
  aiFallbackProvider: "mistral" | "xai";
  aiProviderPriority: string[];
  knowledgeSourceUrl: string;
  vectorDbType: "auto" | "pgvector" | "memory" | "file";
  ragTopK: number;
  ragRelevanceThreshold: number;
  chatRateLimit: number;
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

  const aiProvider = (parsed.AI_PROVIDER === "xai" ? "xai" : "mistral") as "mistral" | "xai";
  const aiFallbackProvider = (parsed.AI_FALLBACK_PROVIDER === "mistral" ? "mistral" : "xai") as "mistral" | "xai";
  const priorityRaw = parsed.AI_PROVIDER_PRIORITY || "mistral,xai";
  const aiProviderPriority = priorityRaw.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);

  const parsedTopK = Number(parsed.RAG_TOP_K);
  const ragTopK = Number.isFinite(parsedTopK) && parsedTopK > 0 ? parsedTopK : 4;

  const parsedThreshold = Number(parsed.RAG_RELEVANCE_THRESHOLD);
  const ragRelevanceThreshold = Number.isFinite(parsedThreshold) && parsedThreshold >= 0 ? parsedThreshold : 0.35;

  const parsedRateLimit = Number(parsed.CHAT_RATE_LIMIT);
  const chatRateLimit = Number.isFinite(parsedRateLimit) && parsedRateLimit > 0 ? parsedRateLimit : 20;

  const vectorDbType = (["auto", "pgvector", "memory", "file"].includes(parsed.VECTOR_DB_TYPE ?? "")
    ? parsed.VECTOR_DB_TYPE
    : "auto") as "auto" | "pgvector" | "memory" | "file";

  cached = {
    databaseUrl: parsed.DATABASE_URL,
    supabaseSecretKey: parsed.SUPABASE_SECRET_KEY ?? parsed.SUPABASE_SERVICE_ROLE_KEY,
    resendApiKey: parsed.RESEND_API_KEY,
    emailFrom: parsed.EMAIL_FROM,
    inquiryNotificationEmail: parsed.INQUIRY_NOTIFICATION_EMAIL,
    ipHashSalt: ipHashSalt || "local-development-salt",
    mistralApiKey: parsed.MISTRAL_API_KEY,
    mistralModel: parsed.MISTRAL_CHAT_MODEL ?? parsed.MISTRAL_MODEL ?? "mistral-small-latest",
    mistralChatModel: parsed.MISTRAL_CHAT_MODEL ?? parsed.MISTRAL_MODEL ?? "mistral-small-latest",
    mistralEmbeddingModel: parsed.MISTRAL_EMBEDDING_MODEL ?? "mistral-embed",
    xaiApiKey: parsed.XAI_API_KEY,
    xaiChatModel: parsed.XAI_CHAT_MODEL ?? "grok-2-latest",
    aiProvider,
    aiFallbackProvider,
    aiProviderPriority: aiProviderPriority.length ? aiProviderPriority : ["mistral", "xai"],
    knowledgeSourceUrl: parsed.KNOWLEDGE_SOURCE_URL ?? publicEnv.siteUrl,
    vectorDbType,
    ragTopK,
    ragRelevanceThreshold,
    chatRateLimit,
  };
  return cached;
}
