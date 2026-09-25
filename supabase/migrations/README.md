# Forward migrations

`../AI_WITH_HAMAD_SETUP.sql` is the canonical, idempotent full setup. When a database is already
provisioned and a change is not purely additive, put the change here as
`YYYYMMDDHHMMSS_short_name.sql` and run it in the Supabase SQL editor (or `psql`) **after** reviewing it.

Rules: keep each migration idempotent where possible, update the setup SQL and `src/db/schema.ts`
in the same PR, and run `npm run test:db`. No secrets in migration files.

No migrations exist yet — the initial schema is the setup file.
