# 058 — Admin dashboard

## Objective

Real counts: inquiries by status, drafts vs published, recent activity, media usage.

## Why This Matters

Everything on the public site must be editable without a deploy, safely and by the right people.

## Dependencies

[044-project-cms](044-project-cms.md), [050-inquiry-cms](050-inquiry-cms.md), [057-audit-logs](057-audit-logs.md)

## Files Expected To Change

- `src/app/admin/page.tsx`

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

Verified visually (screenshot) — counts come from live queries only.
