# 100 — Captcha on public forms and logins

## Objective

Stop bots on contact, sponsorship, staff login, password reset and client login.

## Why This Matters

Public forms and logins are the main abuse targets.

## Dependencies

[071-security-hardening](071-security-hardening.md)

## Files Expected To Change

- `src/server/captcha.ts`
- `src/components/forms/captcha.tsx`
- `src/server/actions/*`

## Implementation Requirements

- Built-in HMAC-signed challenge, 10-minute TTL, single-use nonce
- Optional Cloudflare Turnstile via env; CSP allows it

## Acceptance Criteria

- [x] Wrong/expired/replayed answers rejected server-side

## Verification

- Unit captcha-whatsapp.test.ts
- E2E forms solve captcha

## Status

**COMPLETED**

Verified: lint, typecheck, 74 unit, 31 DB, 56/56 E2E, production build (see docs/FINAL_REPORT.md).
