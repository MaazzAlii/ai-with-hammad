import { publicEnv } from "@/lib/env";

/** Public URL for an object in a public bucket. Returns null for private buckets. */
export function publicObjectUrl(bucket: string, path: string, isPublicBucket = true): string | null {
  if (!publicEnv.supabaseUrl || !isPublicBucket) return null;
  const encoded = path.split("/").map(encodeURIComponent).join("/");
  return `${publicEnv.supabaseUrl}/storage/v1/object/public/${encodeURIComponent(bucket)}/${encoded}`;
}
