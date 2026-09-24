# 019 — Homepage

## Objective

Agency homepage: hero, positioning, services, selected/pinned projects, capabilities, process, team, content, sponsorship CTA, contact CTA.

## Why This Matters

Public pages are the agency's storefront and the main SEO surface.

## Dependencies

[017-public-layout](017-public-layout.md), [012-drizzle-schema](012-drizzle-schema.md)

## Files Expected To Change

- `src/app/(site)/page.tsx`
- `src/components/site/home/*`

## Implementation Requirements

- All content from DB/settings
- Sections hide when empty (no fake data)
- Pinned projects appear automatically

## Acceptance Criteria

- [x] Renders with seed data and with empty DB

## Verification

- Playwright E2E / screenshot review
- `npm run build`

## Status

**COMPLETED**
