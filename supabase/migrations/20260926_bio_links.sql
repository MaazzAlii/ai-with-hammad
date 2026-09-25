-- Link-in-bio (/links) — run once in the Supabase SQL editor on an existing project.
-- Idempotent: safe to run again. Mirrors supabase/AI_WITH_HAMAD_SETUP.sql.

-- Link-in-bio ("Linktree") links shown on /links. Clicks go through /go/<id>.
create table if not exists public.bio_links (
  id             uuid primary key default gen_random_uuid(),
  title          text        not null check (length(title) between 1 and 80),
  url            text        not null check (url ~* '^(https://|mailto:)'),
  description    text        not null default '' check (length(description) <= 160),
  kind           text        not null default 'link' check (kind in ('link','social','affiliate','sponsor')),
  icon           text        not null default '' check (icon ~ '^[a-z0-9-]{0,30}$'),
  team_member_id uuid        references public.team_members (id) on delete set null,
  is_featured    boolean     not null default false,
  is_published   boolean     not null default true,
  starts_at      timestamptz,
  ends_at        timestamptz,
  click_count    integer     not null default 0 check (click_count >= 0),
  sort_order     integer     not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  deleted_at     timestamptz,
  check (ends_at is null or starts_at is null or ends_at > starts_at)
);
create index if not exists bio_links_public_idx on public.bio_links (is_published, sort_order) where deleted_at is null;
create index if not exists bio_links_team_member_idx on public.bio_links (team_member_id);
select private.ensure_updated_at_trigger('public.bio_links');

alter table public.bio_links enable row level security;
select private.apply_content_policies('bio_links',
  'is_published and deleted_at is null and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at > now())',
  'links.write', 'links.write');

insert into public.permissions (key, description) values ('links.write', 'Edit link-in-bio links')
on conflict (key) do update set description = excluded.description;

insert into public.role_permissions (role, permission_key)
select r::public.app_role, 'links.write' from unnest(array['owner','admin','manager','editor']) as r
on conflict do nothing;
