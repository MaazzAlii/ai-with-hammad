# 023 — Projects index

## Objective

Project grid with category/technology filters (URL search params).

## Why This Matters

Public pages are the agency's storefront and the main SEO surface.

## Dependencies

[017-public-layout](017-public-layout.md), [012-drizzle-schema](012-drizzle-schema.md)

## Files Expected To Change

- `src/app/(site)/projects/page.tsx`
- `src/components/site/project-card.tsx`

## Implementation Requirements

- Filters are links (crawlable)
- Rounded media, hover, featured badge

## Acceptance Criteria

- [ ] Filter narrows results

## Verification

- Playwright E2E / screenshot review
- `npm run build`

## Status

**PLANNED**
