# 096 — Client ↔ team messaging

## Objective

Threaded conversations between a client and the team, with unread state and email notification.

## Why This Matters

Direct, recorded communication for project work (everything else stays on WhatsApp).

## Dependencies

[095-client-accounts](095-client-accounts.md)

## Files Expected To Change

- `src/server/actions/portal.ts`
- `src/server/actions/messages.ts`
- `src/server/dal/portal.ts`
- `src/components/portal/*`
- `src/app/admin/messages/*`

## Implementation Requirements

- Client: new conversation, reply, read markers
- Staff (messages.read/write): inbox, reply, open/close, start thread with a client
- Unread badges in sidebar and dashboard
- Notification email without message body; auto-refresh

## Acceptance Criteria

- [x] Round trip client → staff → client verified
- [x] Viewers cannot read conversations

## Verification

- E2E portal.spec.ts

## Status

**COMPLETED**

Verified: lint, typecheck, 74 unit, 31 DB, 56/56 E2E, production build (see docs/FINAL_REPORT.md).
