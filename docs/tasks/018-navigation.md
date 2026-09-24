# 018 — Navigation

## Objective

Accessible desktop nav + mobile menu driven by navigation_items with fallback defaults.

## Why This Matters

Public pages are the agency's storefront and the main SEO surface.

## Dependencies

[017-public-layout](017-public-layout.md)

## Files Expected To Change

- `src/components/site/{header,mobile-nav}.tsx`

## Implementation Requirements

- Active link state (aria-current)
- Mobile menu with focus management + Escape
- Only client component is the toggle

## Acceptance Criteria

- [ ] Keyboard operable; tested at 390px

## Verification

- Playwright E2E / screenshot review
- `npm run build`

## Status

**PLANNED**
