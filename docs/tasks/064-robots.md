# 064 — robots.txt

## Objective

Allow public, disallow /admin /login /auth /api; sitemap reference; block all on non-production.

## Why This Matters

Technical SEO makes real content discoverable; it follows Google Search Essentials and never promises rankings.

## Dependencies

[061-seo-foundation](061-seo-foundation.md)

## Files Expected To Change

- `src/app/robots.ts`

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

Verified: seo.spec.ts robots assertions.
