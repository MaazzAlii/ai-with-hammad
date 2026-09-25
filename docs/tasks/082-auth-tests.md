# 082 — E2E: authentication

## Objective

Login, invalid login, logout, protected redirects, inactive user.

## Why This Matters

Automated tests are the evidence that acceptance criteria are met.

## Dependencies

[078-testing-foundation](078-testing-foundation.md), [015-authentication](015-authentication.md)

## Files Expected To Change

- `tests/e2e/auth.spec.ts`

## Implementation Requirements

- Deterministic, isolated data
- Run in CI-like local stack

## Acceptance Criteria

- [x] All tests green

## Verification

- `npm test`, `npm run test:e2e`

## Status

**COMPLETED**
