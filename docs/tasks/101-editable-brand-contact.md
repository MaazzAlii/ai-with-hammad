# 101 — Everything visible editable from Admin

## Objective

Brand name, logo, loading screen, contact details, WhatsApp, address, hours, tech stack, team photos editable in Admin.

## Why This Matters

The owners must never need a code change to update what visitors see.

## Dependencies

[054-legal-cms](054-legal-cms.md)

## Files Expected To Change

- `src/app/admin/settings/*`
- `src/lib/whatsapp.ts`
- `src/components/site/whatsapp-button.tsx`

## Implementation Requirements

- General settings gain phone, WhatsApp number + message, address, business hours
- Home tech-stack list editable

## Acceptance Criteria

- [x] Changes appear after save (revalidation)

## Verification

- E2E admin settings
- Manual

## Status

**COMPLETED**

Verified: lint, typecheck, 74 unit, 31 DB, 56/56 E2E, production build (see docs/FINAL_REPORT.md).
