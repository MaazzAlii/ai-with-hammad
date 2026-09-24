# 087 — Security audit

## Objective

Structured review of auth bypass, RBAC, storage, data leakage, rates, uploads, XSS, URLs, CSRF, secrets, SQLi, spam.

## Why This Matters

Release tasks move the verified product to production safely.

## Dependencies

[071-security-hardening](071-security-hardening.md)

## Files Expected To Change

- `docs/*.md`

## Implementation Requirements

- Follow docs/VERCEL_DEPLOYMENT.md and docs/SUPABASE_SETUP.md
- Record evidence

## Acceptance Criteria

- [x] Evidence recorded in FINAL_REPORT.md

## Verification

- Manual / command output

## Status

**COMPLETED**

docs/SECURITY_AUDIT.md; one issue found and fixed (unvalidated bound action ids → assertId()).
