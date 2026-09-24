---
name: database-engineering
description: Change the PostgreSQL schema safely: canonical SQL, Drizzle mirror, indexes, constraints, idempotency, and the consistency test.
---
# Database engineering

## Change procedure
1. Edit `supabase/AI_WITH_HAMAD_SETUP.sql` — keep it idempotent (`create table if not exists`, `alter table … add column if not exists`, `do $$ … exception when duplicate_object`, `drop policy if exists` + `create policy`, `on conflict`).
2. Mirror the change in `src/db/schema.ts` (same names, types, nullability, defaults). Add new tables to `publicTables`.
3. Add RLS for new tables (see supabase-engineering skill) and enable RLS in the loop at section 6.
4. `npm run test:db` — builds a fresh DB from the SQL twice and runs schema-consistency + RLS tests.
5. For an existing production DB, also write a forward migration in `supabase/migrations/` (see docs/SUPABASE_SETUP.md#schema-changes) and optionally `npm run db:generate` for the Drizzle snapshot.

## Conventions
- UUID PK `gen_random_uuid()`, `created_at`/`updated_at timestamptz` + `select private.ensure_updated_at_trigger('public.t')`.
- Content tables: `slug` (regex check) with partial unique index `where deleted_at is null`, `is_published`, `published_at`, `is_featured`, `sort_order`, `deleted_at`.
- Every FK gets an index; choose `on delete` deliberately (`cascade` for children, `set null` for optional refs, `restrict` for media used by project_media).
- URL columns get `~* '^https?://'` checks; enums for closed sets.
- Confidential data → separate table with no anon policy.

## Queries
- Drizzle only, server-only. Select explicit columns in public DAL. Batch children with `inArray`. Escape `%`/`_` in `ilike` input.
