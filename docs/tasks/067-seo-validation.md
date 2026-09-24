# 067 — SEO validation

## Objective

Automated checks: unique titles/descriptions, canonical, JSON-LD parse, sitemap contents, robots, noindex on admin.

## Why This Matters

Technical SEO makes real content discoverable; it follows Google Search Essentials and never promises rankings.

## Dependencies

[062-metadata](062-metadata.md), [063-sitemap](063-sitemap.md), [064-robots](064-robots.md), [065-jsonld](065-jsonld.md)

## Files Expected To Change

- `tests/e2e/seo.spec.ts`

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
