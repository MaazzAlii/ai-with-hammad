# 066 — Open Graph images

## Objective

Default + per-entity OG images (cover image or generated ImageResponse).

## Why This Matters

Technical SEO makes real content discoverable; it follows Google Search Essentials and never promises rankings.

## Dependencies

[061-seo-foundation](061-seo-foundation.md)

## Files Expected To Change

- `src/app/opengraph-image.tsx`

## Implementation Requirements

- Absolute URLs from NEXT_PUBLIC_SITE_URL
- Only published content indexed
- Structured data matches visible content

## Acceptance Criteria

- [x] Validated by tests/e2e/seo.spec.ts

## Verification

- Playwright + manual source review

## Status

**COMPLETED**

Verified: seo.spec.ts `/opengraph-image` returns image/png.
