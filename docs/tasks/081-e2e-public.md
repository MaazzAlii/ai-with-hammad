# 081 — E2E: public site

## Objective

All public routes render, filters, contact + sponsorship inquiry submission, 404s.

## Why This Matters

Automated tests are the evidence that acceptance criteria are met.

## Dependencies

[078-testing-foundation](078-testing-foundation.md)

## Files Expected To Change

- `tests/e2e/public.spec.ts`

## Implementation Requirements

- Deterministic, isolated data
- Run in CI-like local stack

## Acceptance Criteria

- [x] All tests green

## Verification

- `npm test`, `npm run test:e2e`

## Status

**COMPLETED**
