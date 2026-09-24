# 022 — Service detail

## Objective

Service page with description, features, related projects and CTA.

## Why This Matters

Public pages are the agency's storefront and the main SEO surface.

## Dependencies

[021-services-page](021-services-page.md)

## Files Expected To Change

- `src/app/(site)/services/[slug]/page.tsx`

## Implementation Requirements

- 404 for drafts/unknown
- generateStaticParams
- Service + Breadcrumb JSON-LD

## Acceptance Criteria

- [ ] Draft slug returns 404

## Verification

- Playwright E2E / screenshot review
- `npm run build`

## Status

**PLANNED**
