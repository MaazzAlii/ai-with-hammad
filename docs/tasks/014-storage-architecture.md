# 014 — Storage architecture

## Objective

Create buckets with MIME/size limits and storage.objects policies.

## Why This Matters

Binary media must never live in Postgres; bucket limits are the server-side upload validation.

## Dependencies

[012-drizzle-schema](012-drizzle-schema.md), [013-rls-policies](013-rls-policies.md)

## Files Expected To Change

- `supabase/AI_WITH_HAMAD_SETUP.sql`
- `src/lib/media/buckets.ts`

## Implementation Requirements

- Buckets: site-assets, project-images, project-gallery, project-videos, team-images, content-thumbnails, content-media, sponsorship-media, media-library (public) and private-documents (private)
- INSERT/UPDATE/DELETE only for media.* permissions
- No anon listing
- Bucket config mirrored in TS for client validation

## Acceptance Criteria

- [x] Storage policy tests pass

## Verification

- tests/db/storage-policies.test.ts

## Status

**COMPLETED**

Verified: tests/db/storage-policies.test.ts + E2E direct-upload-by-viewer → 403.
