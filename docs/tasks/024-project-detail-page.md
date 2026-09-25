# 024 — Project detail

## Objective

Full case-study page: hero, overview, problem, approach, architecture, implementation, tech, features, screenshots, videos, results, metrics, team, related, CTA.

## Why This Matters

Public pages are the agency's storefront and the main SEO surface.

## Dependencies

[023-projects-page](023-projects-page.md), [039-project-media](039-project-media.md)

## Files Expected To Change

- `src/app/(site)/projects/[slug]/page.tsx`

## Implementation Requirements

- Sections render only when populated
- CreativeWork + Breadcrumb (+ VideoObject when video present)

## Acceptance Criteria

- [x] Seeded case study renders all sections

## Verification

- Playwright E2E / screenshot review
- `npm run build`

## Status

**COMPLETED**
