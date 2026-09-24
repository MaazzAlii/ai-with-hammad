# 063 — Sitemap

## Objective

DB-driven sitemap.xml with static + published dynamic routes and lastModified.

## Why This Matters

Technical SEO makes real content discoverable; it follows Google Search Essentials and never promises rankings.

## Dependencies

[061-seo-foundation](061-seo-foundation.md)

## Files Expected To Change

- `src/app/sitemap.ts`

## Implementation Requirements

- Absolute URLs from NEXT_PUBLIC_SITE_URL
- Only published content indexed
- Structured data matches visible content

## Acceptance Criteria

- [ ] Validated by tests/e2e/seo.spec.ts

## Verification

- Playwright + manual source review

## Status

**PLANNED**
