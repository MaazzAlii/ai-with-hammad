# 031 — High-performing content

## Objective

Featured / high-performing / campaign / case-study / latest groupings with admin ordering.

## Why This Matters

Public pages are the agency's storefront and the main SEO surface.

## Dependencies

[028-content-page](028-content-page.md)

## Files Expected To Change

- `src/server/dal/public/content.ts`

## Implementation Requirements

- Groups driven by flags + performance_rank + sort_order
- Latest = published_date desc

## Acceptance Criteria

- [ ] DAL unit/DB test

## Verification

- Playwright E2E / screenshot review
- `npm run build`

## Status

**PLANNED**
