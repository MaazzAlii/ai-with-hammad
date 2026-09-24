# 016 — Role-based access control

## Objective

Implement permission resolution and enforcement in pages and every server action.

## Why This Matters

Frontend checks are cosmetic; server checks are the security boundary.

## Dependencies

[012-drizzle-schema](012-drizzle-schema.md), [015-authentication](015-authentication.md)

## Files Expected To Change

- `src/server/auth/rbac.ts`
- `src/lib/permissions.ts`

## Implementation Requirements

- requirePermission() in every admin page and action
- Role from DB, never from client/user metadata
- Owner protections (last owner, admin cannot modify owners)
- UI hides actions the user lacks permission for

## Acceptance Criteria

- [x] Unit tests for matrix; E2E: editor cannot publish, viewer cannot edit, viewer cannot see inquiries

## Verification

- tests/unit/rbac.test.ts, tests/e2e/roles.spec.ts

## Status

**COMPLETED**

Verified: tests/unit/rbac-audit-email.test.ts, tests/e2e/roles.spec.ts, tests/e2e/users.spec.ts.
