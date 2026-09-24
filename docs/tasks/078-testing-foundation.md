# 078 — Testing foundation

## Objective

Vitest projects (unit, db), Playwright config, local Supabase-like stack scripts.

## Why This Matters

Automated tests are the evidence that acceptance criteria are met.

## Dependencies

[008-nextjs-foundation](008-nextjs-foundation.md)

## Files Expected To Change

- `vitest.config.ts`
- `playwright.config.ts`
- `scripts/local/*`

## Implementation Requirements

- Deterministic, isolated data
- Run in CI-like local stack

## Acceptance Criteria

- [x] All tests green

## Verification

- `npm test`, `npm run test:e2e`

## Status

**COMPLETED**
