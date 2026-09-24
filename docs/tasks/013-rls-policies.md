# 013 — Row Level Security policies

## Objective

Enable RLS everywhere; public read of published rows; staff access via has_permission().

## Why This Matters

The publishable key is public; RLS is the only protection of the Data API.

## Dependencies

[012-drizzle-schema](012-drizzle-schema.md)

## Files Expected To Change

- `supabase/AI_WITH_HAMAD_SETUP.sql`

## Implementation Requirements

- Helpers in private schema with search_path=''
- (select auth.uid()) pattern; TO roles on every policy
- No anon access to inquiries, rates, audit logs, profiles, rate limits

## Acceptance Criteria

- [ ] RLS tests pass for anon, viewer, editor, admin

## Verification

- tests/db/rls.test.ts

## Status

**PLANNED**
