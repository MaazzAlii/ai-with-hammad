# 037 — Responsive design pass

## Objective

Verify all public pages at 360–1920px widths.

## Why This Matters

Public pages are the agency's storefront and the main SEO surface.

## Dependencies

[019-homepage](019-homepage.md), [024-project-detail-page](024-project-detail-page.md), [032-sponsorship-page](032-sponsorship-page.md)

## Files Expected To Change

- `tests/e2e/responsive.spec.ts`

## Implementation Requirements

- No horizontal overflow
- Tap targets >= 40px
- Tables scroll within containers

## Acceptance Criteria

- [x] Playwright overflow check at 8 widths

## Verification

- Playwright E2E / screenshot review
- `npm run build`

## Status

**COMPLETED**

Verified: tests/e2e/responsive.spec.ts (8 widths × 6 pages) + public.spec at 360px.
