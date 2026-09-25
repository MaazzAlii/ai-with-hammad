/**
 * Supabase-managed tables the app reads (never migrates). Kept out of
 * schema.ts so drizzle-kit never generates DDL for the auth/storage schemas.
 */
import { jsonb, pgSchema, text, uuid } from "drizzle-orm/pg-core";

const storageSchema = pgSchema("storage");

export const storageObjects = storageSchema.table("objects", {
  id: uuid("id").primaryKey(),
  bucketId: text("bucket_id"),
  name: text("name"),
  metadata: jsonb("metadata").$type<{ size?: number; mimetype?: string } | null>(),
});
