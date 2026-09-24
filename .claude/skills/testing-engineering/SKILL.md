---
name: testing-engineering
description: How to run and extend unit, database (RLS/storage) and end-to-end tests with the local Supabase-like stack.
---
# Testing engineering

| Layer | Command | Needs |
| --- | --- | --- |
| Unit (`tests/unit`) | `npm run test:unit` | nothing |
| DB (`tests/db`) | `npm run test:db` | local Postgres 16 (`TEST_PG_ADMIN_URL`) |
| E2E (`tests/e2e`) | `npm run test:e2e` | local stack + built app |

## Local stack
`RESET=1 bash scripts/local/up.sh` → Postgres (`aiwh_e2e`), real GoTrue on :9999, gateway on :54321 (auth proxy + storage emulator enforcing `storage.objects` RLS). Keys: `node scripts/local/keys.mjs`. See docs/TESTING.md.

## Writing tests
- DB: use `asRole(sql, "anon" | "authenticated", userId, tx => …)` and `createStaff(sql, role)`.
- E2E: `newContext(browser, role)` gives a signed-in context with its own IP header (rate limits). Use unique slugs (`uid()`), assert DB state with `db()`, check public pages too.
- Every permission rule needs a negative test (the role that must NOT be able to do it).
- Don't retry flaky tests — fix the cause (e.g., overlapping sticky bars, wrong label matches).
