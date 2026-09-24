# 046 — Team CMS

## Objective

CRUD team members, social links, photo, skills; publish/feature/reorder.

## Why This Matters

Everything on the public site must be editable without a deploy, safely and by the right people.

## Dependencies

[016-rbac](016-rbac.md), [043-media-picker](043-media-picker.md)

## Files Expected To Change

- `src/app/admin/team/*`
- `src/server/actions/team.ts`

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
