# 040 — Video management

## Objective

Admin can add YouTube/Vimeo URL, upload a video file, set poster, title, caption.

## Why This Matters

Video is a key portfolio format.

## Dependencies

[038-media-library-backend](038-media-library-backend.md)

## Files Expected To Change

- `src/lib/embeds.ts`
- `src/components/site/video-player.tsx`

## Implementation Requirements

- Parse/normalize provider URLs server-side (youtube-nocookie)
- No downloading of third-party videos
- Uploaded videos stored in project-videos

## Acceptance Criteria

- [x] Unit tests for URL parsing incl. malicious inputs

## Verification

- tests/unit/embeds.test.ts

## Status

**COMPLETED**

Verified: tests/unit/embeds-urls.test.ts; uploaded-video player path covered by code review (same pipeline as images).
