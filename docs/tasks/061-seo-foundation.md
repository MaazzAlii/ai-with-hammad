# 061 — SEO foundation

## Objective

buildMetadata() helper, metadataBase from NEXT_PUBLIC_SITE_URL, title template, defaults from settings.

## Why This Matters

Technical SEO makes real content discoverable; it follows Google Search Essentials and never promises rankings.

## Dependencies

[008-nextjs-foundation](008-nextjs-foundation.md)

## Files Expected To Change

- `src/lib/seo.ts`
- `src/app/layout.tsx`

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
