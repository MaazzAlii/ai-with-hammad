# 035 — Legal pages

## Objective

Privacy Policy, Terms, Cookie Policy editable via legal_documents with safe defaults.

## Why This Matters

Public pages are the agency's storefront and the main SEO surface.

## Dependencies

[017-public-layout](017-public-layout.md), [012-drizzle-schema](012-drizzle-schema.md)

## Files Expected To Change

- `src/app/(site)/{privacy-policy,terms,cookie-policy}/page.tsx`

## Implementation Requirements

- Clear 'last updated' date
- No false compliance claims
- Admin editable

## Acceptance Criteria

- [ ] Pages render; editable in admin

## Verification

- Playwright E2E / screenshot review
- `npm run build`

## Status

**PLANNED**
