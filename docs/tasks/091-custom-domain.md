# 091 — Custom domain

## Objective

Attach domain, set NEXT_PUBLIC_SITE_URL, redirects www/apex, verify canonical/sitemap.

## Why This Matters

Release tasks move the verified product to production safely.

## Dependencies

[090-vercel-deployment](090-vercel-deployment.md)

## Files Expected To Change

- `docs/*.md`

## Implementation Requirements

- Follow docs/VERCEL_DEPLOYMENT.md and docs/SUPABASE_SETUP.md
- Record evidence

## Acceptance Criteria

- [ ] Evidence recorded in FINAL_REPORT.md

## Verification

- Manual / command output

## Status

**BLOCKED**

BLOCKER: domain + DNS are owner-controlled; depends on 090. Code is domain-agnostic via NEXT_PUBLIC_SITE_URL.
