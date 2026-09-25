# 055 — Inquiry intake system

## Objective

Server action for contact/sponsorship inquiries: validation, spam defenses, rate limiting, storage-first, email notify.

## Why This Matters

Everything on the public site must be editable without a deploy, safely and by the right people.

## Dependencies

[012-drizzle-schema](012-drizzle-schema.md), [057-audit-logs](057-audit-logs.md)

## Files Expected To Change

- `src/server/actions/inquiries-public.ts`
- `src/lib/rate-limit.ts`

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
