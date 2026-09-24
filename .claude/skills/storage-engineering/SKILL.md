---
name: storage-engineering
description: Supabase Storage buckets, policies and the upload pipeline (prepare → direct upload → finalize), including large/resumable uploads and deletion.
---
# Storage engineering

## Pipeline
1. Client calls `prepareUpload({bucket, filename, mimeType, size, width, height, durationSeconds})` → server authorizes (`media.upload`; `settings.write` for `site-assets`), runs `validateUpload`, returns a server-generated path `yyyy/mm/<uuid>-<slug>.<ext>`.
2. Browser uploads directly: `supabase.storage.from(bucket).upload(path, file)` (≤ 6 MB) or TUS to `/storage/v1/upload/resumable` with 6 MB chunks.
3. `finalizeUpload` re-validates, reads `storage.objects` metadata (size + mimetype) and removes mismatching objects, then inserts `media_assets`.

## Adding a bucket
1. `storage.buckets` insert in the SQL (public flag, `file_size_limit`, `allowed_mime_types`), add to the policy bucket lists.
2. Add to `BUCKETS` in `src/lib/media/buckets.ts` (same limits).
3. Extend `tests/db/storage-policies.test.ts` (count, MIME list, who can insert/delete).

## Rules
- No anon SELECT policy on `storage.objects` (public buckets still serve files; listing stays private).
- Executable/HTML extensions are blocked in both `validateUpload` and the INSERT policy.
- Deleting: `mediaUsage(id)` must be empty → `removeStoredObjects()` (secret key) → delete row → audit.
- Replace keeps the `media_assets` id (all references keep working) and deletes the old object.
