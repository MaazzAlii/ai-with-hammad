# 062 — Per-page metadata

## Objective

Unique title/description/canonical/OG/Twitter for every public page incl. dynamic routes; noindex for admin/login/drafts.

## Why This Matters

Technical SEO makes real content discoverable; it follows Google Search Essentials and never promises rankings.

## Dependencies

[061-seo-foundation](061-seo-foundation.md)

## Files Expected To Change

- `src/app/(site)/**/page.tsx`

## Implementation Requirements

- Absolute URLs from NEXT_PUBLIC_SITE_URL
- Only published content indexed
- Structured data matches visible content

## Acceptance Criteria

- [x] Validated by tests/e2e/seo.spec.ts

## Verification

- Playwright + manual source review

## Status

**COMPLETED**
