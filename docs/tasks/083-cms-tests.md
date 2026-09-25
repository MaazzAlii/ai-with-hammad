# 083 — E2E: CMS workflows

## Objective

Project create/upload/publish/pin, service, team, content creation, inquiry status change.

## Why This Matters

Automated tests are the evidence that acceptance criteria are met.

## Dependencies

[078-testing-foundation](078-testing-foundation.md), [044-project-cms](044-project-cms.md)

## Files Expected To Change

- `tests/e2e/admin.spec.ts`

## Implementation Requirements

- Deterministic, isolated data
- Run in CI-like local stack

## Acceptance Criteria

- [x] All tests green

## Verification

- `npm test`, `npm run test:e2e`

## Status

**COMPLETED**
