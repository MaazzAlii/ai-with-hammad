# 032 — Sponsorship page

## Objective

Who we are, audience, categories, platforms, selected content, performance, previous partnerships, formats, why partner, inquiry form.

## Why This Matters

Public pages are the agency's storefront and the main SEO surface.

## Dependencies

[017-public-layout](017-public-layout.md), [012-drizzle-schema](012-drizzle-schema.md)

## Files Expected To Change

- `src/app/(site)/sponsorship/page.tsx`

## Implementation Requirements

- 'Partnership rates are available upon request.'
- Never query rates table
- Sections hide when empty

## Acceptance Criteria

- [ ] Response HTML contains no rate values (E2E)

## Verification

- Playwright E2E / screenshot review
- `npm run build`

## Status

**PLANNED**
