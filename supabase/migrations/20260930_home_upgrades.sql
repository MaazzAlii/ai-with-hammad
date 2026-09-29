-- Home page upgrade batch (2026-09-30): newsletter signups + the "newsletter.manage" permission.
-- Run once in the Supabase SQL editor; safe to re-run.

create table if not exists public.newsletter_subscribers (
  id              uuid primary key default gen_random_uuid(),
  email           text        not null check (email ~* '^[^\s@]+@[^\s@]+\.[^\s@]+$'),
  source_path     text        not null default '',
  ip_hash         text,
  unsubscribed_at timestamptz,
  created_at      timestamptz not null default now()
);
create unique index if not exists newsletter_subscribers_email_idx on public.newsletter_subscribers (lower(email));

alter table public.newsletter_subscribers enable row level security;
revoke all on public.newsletter_subscribers from anon;

drop policy if exists "newsletter read" on public.newsletter_subscribers;
create policy "newsletter read" on public.newsletter_subscribers
  for select to authenticated using ((select private.has_permission('newsletter.manage')));
drop policy if exists "newsletter delete" on public.newsletter_subscribers;
create policy "newsletter delete" on public.newsletter_subscribers
  for delete to authenticated using ((select private.has_permission('newsletter.manage')));

insert into public.permissions (key, description) values
  ('newsletter.manage', 'Read and remove newsletter subscribers')
on conflict (key) do update set description = excluded.description;

insert into public.role_permissions (role, permission_key)
select r, 'newsletter.manage'
from unnest(array['owner','admin','manager']::public.app_role[]) as r
on conflict do nothing;

-- Team photos: cap at 6 MB (was 10 MB). Large originals could take the Vercel
-- image optimizer close to a minute to resize on the first (cold-cache) request —
-- this is the "founder photo loads blank then pops in after a minute" bug.
update storage.buckets set file_size_limit = 6291456 where id = 'team-images';
