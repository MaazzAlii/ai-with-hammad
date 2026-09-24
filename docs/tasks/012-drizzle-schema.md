# 012 — Database schema (SQL + Drizzle)

## Objective

Create the normalized schema in the canonical SQL setup file and mirror it in Drizzle.

## Why This Matters

The data model underpins every feature.

## Dependencies

[003-architecture-definition](003-architecture-definition.md)

## Files Expected To Change

- `supabase/AI_WITH_HAMAD_SETUP.sql`
- `src/db/schema.ts`
- `src/db/index.ts`
- `drizzle.config.ts`
- `drizzle/`

## Implementation Requirements

- All tables in PLAN.md with UUIDs, FKs, indexes, unique constraints, timestamps, slugs, flags, sort order, soft delete
- Idempotent SQL (re-runnable)
- updated_at trigger
- Drizzle baseline generated

## Acceptance Criteria

- [ ] SQL applies twice without error
- [ ] Schema consistency test passes

## Verification

- `npm run test:db`

## Status

**PLANNED**
