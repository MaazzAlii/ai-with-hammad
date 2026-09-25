# 011 — Supabase foundation

## Objective

Create server/browser/admin Supabase clients and environment validation.

## Why This Matters

Correct cookie handling and key separation are prerequisites for auth and storage.

## Dependencies

[008-nextjs-foundation](008-nextjs-foundation.md)

## Files Expected To Change

- `src/lib/env.ts`
- `src/lib/supabase/{server,client,admin,proxy}.ts`
- `.env.example`

## Implementation Requirements

- @supabase/ssr getAll/setAll pattern
- Secret key only in server-only module
- Support publishable/anon and secret/service_role key names

## Acceptance Criteria

- [x] Clients compile; secret key never imported by client code

## Verification

- Typecheck; `grep -r SUPABASE_SECRET src/components` is empty

## Status

**COMPLETED**
