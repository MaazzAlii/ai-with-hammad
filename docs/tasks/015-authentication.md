# 015 — Authentication

## Objective

Staff sign-in with Supabase Auth (email+password), sign-out, session refresh in proxy.ts; no public signup.

## Why This Matters

Protects the CMS; invite-only reduces attack surface.

## Dependencies

[011-supabase-foundation](011-supabase-foundation.md), [012-drizzle-schema](012-drizzle-schema.md)

## Files Expected To Change

- `src/proxy.ts`
- `src/app/login/*`
- `src/app/auth/*`
- `src/server/auth/session.ts`

## Implementation Requirements

- Login form with zod validation and generic error messages
- Proxy refreshes session and redirects unauthenticated /admin requests
- Inactive profiles cannot access admin
- Login/logout audit logged

## Acceptance Criteria

- [ ] E2E: login success/failure, logout, redirect when signed out

## Verification

- tests/e2e/auth.spec.ts

## Status

**PLANNED**
