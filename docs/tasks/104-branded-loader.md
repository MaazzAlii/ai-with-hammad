# 104 — Branded loading screen

## Objective

Navigation loader overlay using the logo and agency name from settings.

## Why This Matters

Branded perceived performance without breaking 404 status codes.

## Dependencies

[101-editable-brand-contact](101-editable-brand-contact.md)

## Files Expected To Change

- `src/components/site/navigation-loader.tsx`

## Implementation Requirements

- No loading.tsx above notFound() routes (soft-404 fix)

## Acceptance Criteria

- [x] Unknown slugs return HTTP 404

## Verification

- curl status check
- E2E

## Status

**COMPLETED**

Verified: lint, typecheck, 74 unit, 31 DB, 56/56 E2E, production build (see docs/FINAL_REPORT.md).
