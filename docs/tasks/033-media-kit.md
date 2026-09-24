# 033 — Media kit

## Objective

Printable media-kit page structured for future PDF generation.

## Why This Matters

Public pages are the agency's storefront and the main SEO surface.

## Dependencies

[032-sponsorship-page](032-sponsorship-page.md)

## Files Expected To Change

- `src/app/(site)/media-kit/page.tsx`
- `src/app/print.css`

## Implementation Requirements

- Print stylesheet
- Data from settings.media_kit + platforms + content + partners

## Acceptance Criteria

- [ ] Print emulation screenshot legible

## Verification

- Playwright E2E / screenshot review
- `npm run build`

## Status

**PLANNED**
