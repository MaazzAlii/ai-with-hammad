# 051 — Media library UI

## Objective

Grid/list with upload, preview, search, filter, sort, rename, replace, delete, copy URL, metadata.

## Why This Matters

Everything on the public site must be editable without a deploy, safely and by the right people.

## Dependencies

[038-media-library-backend](038-media-library-backend.md)

## Files Expected To Change

- `src/app/admin/media/*`

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
