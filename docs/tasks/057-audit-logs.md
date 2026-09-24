# 057 — Audit logs

## Objective

Record auth, CRUD, publish, feature, media, settings, role events; viewer UI with filters.

## Why This Matters

Everything on the public site must be editable without a deploy, safely and by the right people.

## Dependencies

[012-drizzle-schema](012-drizzle-schema.md), [016-rbac](016-rbac.md)

## Files Expected To Change

- `src/server/audit.ts`
- `src/app/admin/audit/*`

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

**PLANNED**
