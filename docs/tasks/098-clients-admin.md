# 098 — Clients admin (lightweight CRM)

## Objective

Manage client organisations, their portal users and activation.

## Why This Matters

Owners need to onboard and offboard clients without code.

## Dependencies

[095-client-accounts](095-client-accounts.md)

## Files Expected To Change

- `src/server/actions/clients.ts`
- `src/app/admin/clients/*`
- `src/components/admin/client-form.tsx`

## Implementation Requirements

- clients.read / clients.manage permissions
- Invite portal user (kind=client), deactivate/reactivate

## Acceptance Criteria

- [x] Role matrix mirrored in SQL and code

## Verification

- Unit RBAC matrix test
- E2E

## Status

**COMPLETED**

Verified: lint, typecheck, 74 unit, 31 DB, 56/56 E2E, production build (see docs/FINAL_REPORT.md).
