# Supabase setup

Everything the database needs is in **`supabase/AI_WITH_HAMAD_SETUP.sql`** (tables, indexes,
triggers, RLS, storage buckets + policies, roles/permissions, starter settings, navigation, legal
templates and the three starter services carried over from the original site). It is idempotent.

## 1. Create the project

1. <https://supabase.com/dashboard> → **New project** (choose the region closest to your audience).
2. Save the database password in your password manager (it is needed for `DATABASE_URL`).

## 2. Run the setup SQL

1. Dashboard → **SQL Editor** → New query → paste the full contents of `supabase/AI_WITH_HAMAD_SETUP.sql` → **Run**.
2. Re-running later is safe (use it to apply updates to buckets/policies/seed).
3. Check: Table editor shows 30 tables in `public`; Storage shows 10 buckets.

## 3. Configure Auth

Dashboard → **Authentication**:

- **Sign In / Providers → Email**: enabled. **Allow new users to sign up: OFF** (invite-only).
- Password minimum length: **12**.
- **URL Configuration**: Site URL = your canonical URL (e.g. `https://aiwithhamad.com`);
  Redirect URLs: `https://aiwithhamad.com/**`, `https://*-<your-vercel-team>.vercel.app/**` (previews), `http://localhost:3000/**`.
- **Emails → Templates** (server-side token flow used by `/auth/confirm`):
  - *Invite user* link: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite&next=/auth/set-password`
  - *Reset password* link: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/auth/set-password`
- **SMTP**: configure a custom SMTP sender for production (the built-in sender is rate-limited).

## 4. Create the first owner

1. **Authentication → Users → Add user → Create new user** (your email + strong password, "Auto confirm").
2. SQL Editor: `select private.promote_to_owner('you@example.com');`
3. Sign in at `/login`. Invite everyone else from **Admin → Users** (requires `SUPABASE_SECRET_KEY`).

## 5. Keys and connection string

Dashboard → **Project Settings → API Keys** / **Database**:

| Env var | Where |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key (`sb_publishable_…`) or legacy `anon` key (then use `NEXT_PUBLIC_SUPABASE_ANON_KEY`) |
| `SUPABASE_SECRET_KEY` | Secret key (`sb_secret_…`) or legacy `service_role` (`SUPABASE_SERVICE_ROLE_KEY`). **Server only.** |
| `DATABASE_URL` | Connect → **Transaction pooler** (port 6543) URI with your DB password |

## 6. Storage

Buckets and policies are created by the SQL. Check **Storage → Settings → Upload file size limit**
(global) — it must be ≥ the largest bucket limit you need (videos: 500 MB configured; free plans cap
lower). Resumable (TUS) uploads are used automatically above 6 MB.

## 7. What the SQL guarantees

- RLS enabled on all 30 tables; anonymous Data API access limited to published content.
- `sponsorship_package_rates`, inquiries, notes, audit logs, profiles, rate limits: no anonymous access.
- Helper functions in schema `private` (not exposed by the Data API).
- New auth users → inactive `viewer` profile; last active owner cannot be demoted/deactivated.
- Buckets enforce MIME allow-lists and size limits; only staff with `media.*` permissions can write; nobody anonymous can list.

Verified by `tests/db/*.test.ts` (fresh DB built from this file, twice).

## Schema changes

1. Edit the SQL (idempotently) and `src/db/schema.ts`; run `npm run test:db`.
2. For an already-provisioned database, add a forward migration `supabase/migrations/<timestamp>_<name>.sql`
   containing only the change (you can also re-run the whole setup file — it is idempotent for additive changes).
3. Optionally `npm run db:generate` to update the Drizzle snapshot in `drizzle/` (a baseline, not applied to databases set up by the SQL).
