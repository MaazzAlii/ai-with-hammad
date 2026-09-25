# 099 — FAQ module

## Objective

Editable FAQs shown on the homepage and contact page.

## Why This Matters

Answers common questions without code changes.

## Dependencies

[044-project-cms](044-project-cms.md)

## Files Expected To Change

- `src/server/actions/faqs.ts`
- `src/app/admin/faqs/*`
- `src/components/site/faq.tsx`

## Implementation Requirements

- faqs.write permission; publish flag; ordering

## Acceptance Criteria

- [x] FAQs editable from Admin and rendered publicly

## Verification

- E2E / manual

## Status

**COMPLETED**

Verified: lint, typecheck, 74 unit, 31 DB, 56/56 E2E, production build (see docs/FINAL_REPORT.md).
