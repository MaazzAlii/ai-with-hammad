# 036 — Public 404 and error pages

## Objective

Branded not-found and error boundaries.

## Why This Matters

Public pages are the agency's storefront and the main SEO surface.

## Dependencies

[017-public-layout](017-public-layout.md)

## Files Expected To Change

- `src/app/not-found.tsx`
- `src/app/(site)/error.tsx`
- `src/app/global-error.tsx`

## Implementation Requirements

- Helpful links
- No stack traces to users

## Acceptance Criteria

- [x] Unknown URL returns 404 status

## Verification

- Playwright E2E / screenshot review
- `npm run build`

## Status

**COMPLETED**
