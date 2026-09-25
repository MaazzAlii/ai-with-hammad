# 029 — Content detail

## Objective

Content item page with click-to-load embed, description and metrics.

## Why This Matters

Public pages are the agency's storefront and the main SEO surface.

## Dependencies

[028-content-page](028-content-page.md), [041-video-performance](041-video-performance.md)

## Files Expected To Change

- `src/app/(site)/content/[slug]/page.tsx`

## Implementation Requirements

- Embed facade; external link fallback
- VideoObject when embeddable video

## Acceptance Criteria

- [x] Renders without loading iframe initially

## Verification

- Playwright E2E / screenshot review
- `npm run build`

## Status

**COMPLETED**
