# 084 — E2E: media upload

## Objective

Upload image via media library, verify record and public URL, delete.

## Why This Matters

Automated tests are the evidence that acceptance criteria are met.

## Dependencies

[078-testing-foundation](078-testing-foundation.md), [038-media-library-backend](038-media-library-backend.md)

## Files Expected To Change

- `tests/e2e/media.spec.ts`

## Implementation Requirements

- Deterministic, isolated data
- Run in CI-like local stack

## Acceptance Criteria

- [x] All tests green

## Verification

- `npm test`, `npm run test:e2e`

## Status

**COMPLETED**
