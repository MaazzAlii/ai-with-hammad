# 080 — Database, RLS & storage policy tests

## Objective

SQL idempotency, schema consistency, RLS by role, storage policies, rates isolation.

## Why This Matters

Automated tests are the evidence that acceptance criteria are met.

## Dependencies

[078-testing-foundation](078-testing-foundation.md), [013-rls-policies](013-rls-policies.md), [014-storage-architecture](014-storage-architecture.md)

## Files Expected To Change

- `tests/db/*`

## Implementation Requirements

- Deterministic, isolated data
- Run in CI-like local stack

## Acceptance Criteria

- [x] All tests green

## Verification

- `npm test`, `npm run test:e2e`

## Status

**COMPLETED**
