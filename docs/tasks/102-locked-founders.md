# 102 — Locked founders

## Objective

Hammadullah and Maaz Ali are seeded as founders whose names cannot be changed or deleted; everything else stays editable.

## Why This Matters

Owner requirement: founder names are fixed.

## Dependencies

[049-sponsorship-cms](049-sponsorship-cms.md)

## Files Expected To Change

- `supabase/AI_WITH_HAMAD_SETUP.sql`
- `src/server/actions/team.ts`
- `src/components/admin/team-form.tsx`

## Implementation Requirements

- team_members.is_locked + trigger blocking rename/re-slug/unlock/delete
- Form shows name/slug read-only, no delete button; photo/bio/links editable

## Acceptance Criteria

- [x] Trigger enforced even via SQL

## Verification

- DB rls.test.ts
- E2E portal.spec.ts names test

## Status

**COMPLETED**

Verified: lint, typecheck, 74 unit, 31 DB, 56/56 E2E, production build (see docs/FINAL_REPORT.md).
