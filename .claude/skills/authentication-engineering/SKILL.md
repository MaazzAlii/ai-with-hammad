---
name: authentication-engineering
description: Sign-in, invites, password reset, sessions and sign-out with Supabase Auth in this app.
---
# Authentication engineering

## Flows
- Sign in: `src/app/login` → `signIn` action (rate-limited per IP + email, generic errors, inactive profiles signed out, `last_sign_in_at`, `auth.login` audit) → `redirect(safeNextPath(next))`.
- Invite: Admin → Users → `inviteUser` (secret key `auth.admin.inviteUserByEmail`) → email link → `/auth/confirm` (`verifyOtp`) → `/auth/set-password`.
- Reset: login "Forgot password?" → `requestPasswordReset` (always generic success) → same confirm/set-password flow.
- Sign out: POST `/auth/signout` (origin-checked) → revokes sessions (global) → `/login`.
- Deactivation: `updateUser` with `isActive=false` also calls `auth.admin.signOut(id)`.

## Rules
- Server identity = `getUser()`; `proxy.ts` uses `getClaims()` only for the fast redirect.
- Never add a signup page. The DB trigger gives new auth users an inactive viewer profile.
- Password minimum 12 chars (`setPassword`); also configure the same minimum in Supabase Auth settings.
- E2E: `tests/e2e/auth.spec.ts` covers redirect, wrong password, inactive, next/open-redirect, sign-out CSRF.
