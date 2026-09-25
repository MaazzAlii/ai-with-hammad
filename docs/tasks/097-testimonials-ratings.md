# 097 — Client testimonials & ratings

## Objective

Clients submit a 1–5 star rating and testimonial after work; staff moderate and publish.

## Why This Matters

Real social proof only — no fabricated reviews.

## Dependencies

[095-client-accounts](095-client-accounts.md)

## Files Expected To Change

- `src/server/actions/testimonials.ts`
- `src/app/portal/(app)/feedback/*`
- `src/app/admin/testimonials/*`
- `src/app/(site)/testimonials/page.tsx`
- `src/components/site/testimonials.tsx`

## Implementation Requirements

- DB check: published requires approved
- testimonials.moderate for approve/reject/publish; editors cannot
- Public page + homepage section show published only; average rating from published only

## Acceptance Criteria

- [x] Submit → approve → publish → visible publicly verified

## Verification

- E2E portal.spec.ts
- DB constraint test

## Status

**COMPLETED**

Verified: lint, typecheck, 74 unit, 31 DB, 56/56 E2E, production build (see docs/FINAL_REPORT.md).
