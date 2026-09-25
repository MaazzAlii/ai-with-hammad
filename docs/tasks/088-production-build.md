# 088 — Production build

## Objective

Clean `npm run check` (lint, typecheck, tests, build).

## Why This Matters

Release tasks move the verified product to production safely.

## Dependencies

[085-role-tests](085-role-tests.md)

## Files Expected To Change

- `docs/*.md`

## Implementation Requirements

- Follow docs/VERCEL_DEPLOYMENT.md and docs/SUPABASE_SETUP.md
- Record evidence

## Acceptance Criteria

- [x] Evidence recorded in FINAL_REPORT.md

## Verification

- Manual / command output

## Status

**COMPLETED**

Verified: lint 0 problems, typecheck clean, 77 unit/DB tests, 48 E2E tests, `next build` (46 routes).
