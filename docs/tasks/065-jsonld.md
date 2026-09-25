# 065 — Structured data

## Objective

Organization, WebSite, BreadcrumbList, Service, Person, CreativeWork, Article, VideoObject from visible content.

## Why This Matters

Technical SEO makes real content discoverable; it follows Google Search Essentials and never promises rankings.

## Dependencies

[061-seo-foundation](061-seo-foundation.md)

## Files Expected To Change

- `src/lib/jsonld.ts`
- `src/components/site/json-ld.tsx`

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

Verified: seo.spec.ts parses all JSON-LD and checks types; escaping unit-tested.
