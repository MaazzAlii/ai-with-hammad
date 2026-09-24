import "server-only";

import { and, eq } from "drizzle-orm";

import { getDb } from "@/db";
import { storageObjects } from "@/db/external";
import { createSupabaseAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";

import { UserFacingError } from "./errors";

/** Read the stored object's metadata directly from storage.objects (same Postgres). */
export async function getStoredObject(bucket: string, path: string) {
  const [row] = await getDb()
    .select({ id: storageObjects.id, metadata: storageObjects.metadata })
    .from(storageObjects)
    .where(and(eq(storageObjects.bucketId, bucket), eq(storageObjects.name, path)));
  return row ?? null;
}

/** Delete objects with the privileged client (after the caller was authorized in app code). */
export async function removeStoredObjects(bucket: string, paths: string[]) {
  if (!paths.length) return;
  if (!isSupabaseAdminConfigured()) throw new UserFacingError("Storage deletion requires SUPABASE_SECRET_KEY on the server.");
  const { error } = await createSupabaseAdminClient().storage.from(bucket).remove(paths);
  if (error) throw new Error(`Storage delete failed: ${error.message}`);
}

export async function createSignedUrl(bucket: string, path: string, expiresIn = 300) {
  if (!isSupabaseAdminConfigured()) throw new UserFacingError("Signed URLs require SUPABASE_SECRET_KEY on the server.");
  const { data, error } = await createSupabaseAdminClient().storage.from(bucket).createSignedUrl(path, expiresIn);
  if (error || !data) throw new Error("Could not create signed URL");
  return data.signedUrl;
}
