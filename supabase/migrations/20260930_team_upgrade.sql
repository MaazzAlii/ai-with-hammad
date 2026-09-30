-- Team page upgrade batch (2026-09-30): timezone, languages, certifications,
-- contact email, fun fact, philosophy, advisor grouping, speaking appearances,
-- and company-wide philosophy/open-roles/culture-photo settings.
-- Run once in the Supabase SQL editor; safe to re-run.

do $$ begin
  create type public.team_member_type as enum ('team', 'advisor');
exception when duplicate_object then null; end $$;

alter table public.team_members add column if not exists timezone text not null default '';
alter table public.team_members add column if not exists languages text[] not null default '{}';
alter table public.team_members add column if not exists certifications text[] not null default '{}';
alter table public.team_members add column if not exists email text;
alter table public.team_members add column if not exists fun_fact text not null default '';
alter table public.team_members add column if not exists philosophy text not null default '';
alter table public.team_members add column if not exists member_type public.team_member_type not null default 'team';

create table if not exists public.team_appearances (
  id             uuid primary key default gen_random_uuid(),
  team_member_id uuid        not null references public.team_members (id) on delete cascade,
  title          text        not null,
  url            text        check (url is null or url ~* '^https?://'),
  venue          text        not null default '',
  appeared_on    date,
  sort_order     integer     not null default 0,
  created_at     timestamptz not null default now()
);
create index if not exists team_appearances_member_idx on public.team_appearances (team_member_id, sort_order);

alter table public.team_appearances enable row level security;

select private.apply_content_policies('team_appearances',
  'exists (select 1 from public.team_members m where m.id = team_member_id and m.is_published and m.deleted_at is null)',
  'team.write', 'team.write');
