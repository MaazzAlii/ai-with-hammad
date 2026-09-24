# 095 — Client accounts & portal auth

## Objective

Add client organisations and client login accounts that are fully separated from staff accounts.

## Why This Matters

Clients must message the team directly without ever reaching the CMS.

## Dependencies

[012-drizzle-schema](012-drizzle-schema.md), [013-rls-policies](013-rls-policies.md)

## Files Expected To Change

- `supabase/AI_WITH_HAMAD_SETUP.sql`
- `src/db/schema.ts`
- `src/server/auth/client-session.ts`
- `src/app/portal/login/*`
- `src/proxy.ts`

## Implementation Requirements

- profiles.kind (staff|client) + client_id; clients table
- getCurrentStaff / has_permission accept staff only; staff login refuses clients
- requireClient/authorizeClient; anonymous /portal redirects to /portal/login
- Invite-only (Admin → Clients → invite)

## Acceptance Criteria

- [x] Clients cannot open /admin or sign in at /login
- [x] Client pages scoped to own client_id

## Verification

- E2E portal.spec.ts isolation test
- DB rls.test.ts client isolation

## Status

**COMPLETED**

Verified: lint, typecheck, 74 unit, 31 DB, 56/56 E2E, production build (see docs/FINAL_REPORT.md).
