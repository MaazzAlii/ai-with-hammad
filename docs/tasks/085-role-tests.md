# 085 — E2E: role restrictions

## Objective

Viewer/editor/manager restrictions enforced server-side.

## Why This Matters

Automated tests are the evidence that acceptance criteria are met.

## Dependencies

[078-testing-foundation](078-testing-foundation.md), [016-rbac](016-rbac.md)

## Files Expected To Change

- `tests/e2e/roles.spec.ts`

## Implementation Requirements

- Deterministic, isolated data
- Run in CI-like local stack

## Acceptance Criteria

- [ ] All tests green

## Verification

- `npm test`, `npm run test:e2e`

## Status

**PLANNED**
