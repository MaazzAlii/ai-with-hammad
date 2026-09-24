# 060 — Drag-and-drop reordering

## Objective

Sortable lists for projects/services/team/content/media with persisted sort_order.

## Why This Matters

Everything on the public site must be editable without a deploy, safely and by the right people.

## Dependencies

[044-project-cms](044-project-cms.md)

## Files Expected To Change

- `src/components/admin/sortable-list.tsx`
- `src/server/actions/reorder.ts`

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
