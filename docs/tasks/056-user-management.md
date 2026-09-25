# 056 — User management

## Objective

Invite staff, change roles, deactivate; owner safeguards.

## Why This Matters

Everything on the public site must be editable without a deploy, safely and by the right people.

## Dependencies

[016-rbac](016-rbac.md)

## Files Expected To Change

- `src/app/admin/users/*`
- `src/server/actions/users.ts`

## Implementation Requirements

- zod validation shared by client and server
- requirePermission on page and every action
- Audit log for every mutation
- revalidatePath after mutation
- Accessible forms with inline errors

## Acceptance Criteria

- [ ] CRUD works end-to-end
- [ ] Role restrictions enforced server-side

## Verification

- Playwright admin E2E
- `npm run typecheck`

## Status

**BLOCKED**

BLOCKER: the email-invite step needs a real Supabase project with SMTP (local GoTrue has no mail server). Role change, deactivation (session revocation) and owner protections are verified in tests/e2e/users.spec.ts and roles.spec.ts.
