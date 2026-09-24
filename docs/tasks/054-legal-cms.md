# 054 — Legal documents CMS

## Objective

Edit legal page content with last-updated date.

## Why This Matters

Everything on the public site must be editable without a deploy, safely and by the right people.

## Dependencies

[016-rbac](016-rbac.md)

## Files Expected To Change

- `src/app/admin/legal/*`

## Implementation Requirements

- zod validation shared by client and server
- requirePermission on page and every action
- Audit log for every mutation
- revalidatePath after mutation
- Accessible forms with inline errors

## Acceptance Criteria

- [x] CRUD works end-to-end
- [x] Role restrictions enforced server-side

## Verification

- Playwright admin E2E
- `npm run typecheck`

## Status

**COMPLETED**
