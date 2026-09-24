# 021 — Services index

## Objective

List published services with summary, icon and features.

## Why This Matters

Public pages are the agency's storefront and the main SEO surface.

## Dependencies

[017-public-layout](017-public-layout.md), [012-drizzle-schema](012-drizzle-schema.md)

## Files Expected To Change

- `src/app/(site)/services/page.tsx`

## Implementation Requirements

- Ordered by sort_order
- ItemList/Service JSON-LD

## Acceptance Criteria

- [x] Only published services shown

## Verification

- Playwright E2E / screenshot review
- `npm run build`

## Status

**COMPLETED**
