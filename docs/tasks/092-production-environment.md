# 092 — Production environment

## Objective

Env var matrix, secrets handling, Supabase auth URL config, email domain verification.

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

BLOCKER: depends on 089/090 (keys and env vars must be created in the owner's accounts). Matrix documented in docs/VERCEL_DEPLOYMENT.md and .env.example.
