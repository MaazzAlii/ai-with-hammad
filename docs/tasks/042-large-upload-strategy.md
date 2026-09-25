# 042 — Large upload strategy

## Objective

TUS resumable upload for files > 6 MB with progress and cancel.

## Why This Matters

Standard uploads are only recommended to 6 MB.

## Dependencies

[038-media-library-backend](038-media-library-backend.md)

## Files Expected To Change

- `src/components/admin/media-uploader.tsx`

## Implementation Requirements

- tus-js-client with 6 MB chunks against /storage/v1/upload/resumable
- Progress bar + cancel
- Falls back to standard upload <= 6 MB

## Acceptance Criteria

- [ ] Code path reviewed; standard path E2E tested (resumable not available in local emulator)

## Verification

- Manual review + typecheck

## Status

**BLOCKED**

BLOCKER: the TUS resumable path (> 6 MB) needs real Supabase Storage; the local emulator does not implement TUS. Standard uploads (≤ 6 MB) are E2E-verified. Verify by uploading a > 6 MB video after the Supabase project exists.
