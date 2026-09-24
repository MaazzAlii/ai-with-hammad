# 025 — Case-study system

## Objective

Structured case-study fields and consistent narrative layout reused across projects.

## Why This Matters

Public pages are the agency's storefront and the main SEO surface.

## Dependencies

[024-project-detail-page](024-project-detail-page.md)

## Files Expected To Change

- `src/components/site/case-study/*`

## Implementation Requirements

- Markdown-lite rendering for long fields (escaped)
- Table of contents for long case studies

## Acceptance Criteria

- [ ] Unit test for markdown escaping

## Verification

- Playwright E2E / screenshot review
- `npm run build`

## Status

**PLANNED**
