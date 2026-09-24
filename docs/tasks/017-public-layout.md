# 017 — Public layout

## Objective

Header, footer, skip link, main landmark, analytics mount for all public pages.

## Why This Matters

Public pages are the agency's storefront and the main SEO surface.

## Dependencies

[010-design-tokens](010-design-tokens.md)

## Files Expected To Change

- `src/app/(site)/layout.tsx`
- `src/components/site/{header,footer}.tsx`

## Implementation Requirements

- Skip link
- Footer from navigation_items (footer, legal)
- Responsive container
- Server-rendered

## Acceptance Criteria

- [x] No horizontal overflow at 360px

## Verification

- Playwright E2E / screenshot review
- `npm run build`

## Status

**COMPLETED**
