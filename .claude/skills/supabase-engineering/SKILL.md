---
name: supabase-engineering
description: Supabase specifics: clients/keys, Auth configuration, RLS policy patterns, private helper schema, and running the setup SQL.
---
# Supabase engineering

## Clients (`src/lib/supabase/`)
- `server.ts` — per-request, user cookies (Server Components/actions). `client.ts` — browser (uploads only).
- `admin.ts` — secret/service key, server-only, bypasses RLS: only after `authorize()`; used for invites, storage deletes, signed URLs.
- Keys: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or legacy anon), `SUPABASE_SECRET_KEY` (or legacy service_role).

## RLS pattern
```sql
alter table public.t enable row level security;
-- public read (only if the table is public content)
create policy "public read" on public.t for select to anon, authenticated using (is_published and deleted_at is null);
-- staff
create policy "staff update" on public.t for update to authenticated
  using ((select private.has_permission('x.write'))) with check ((select private.has_permission('x.write')));
```
- Use `private.apply_content_policies(table, public_filter, write_perm, delete_perm)` for standard content tables.
- Always `to <role>`, wrap helpers in `(select …)`, helpers live in schema `private` with `security definer set search_path = ''`.
- Sensitive tables: `revoke all … from anon` and no anon policy.
- Test every policy in `tests/db/rls.test.ts` with `asRole()`.

## Auth settings (dashboard)
Disable signups, set Site URL + redirect URLs, email templates use `/auth/confirm?token_hash={{ .TokenHash }}&type=invite|recovery&next=/auth/set-password` (docs/SUPABASE_SETUP.md).
