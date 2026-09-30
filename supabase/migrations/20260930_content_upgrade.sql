-- Content/Tutorials page upgrade batch (2026-09-30): written tutorials,
-- difficulty, read/watch time, author byline, resource downloads.
-- Run once in the Supabase SQL editor; safe to re-run.

do $$ begin
  create type public.content_type as enum ('video', 'article');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.content_difficulty as enum ('beginner', 'intermediate', 'advanced');
exception when duplicate_object then null; end $$;

alter table public.content_items alter column url drop not null;
alter table public.content_items add column if not exists content_type public.content_type not null default 'video';
alter table public.content_items add column if not exists body_md text not null default '';
alter table public.content_items add column if not exists difficulty public.content_difficulty;
alter table public.content_items add column if not exists duration_minutes integer;
alter table public.content_items add column if not exists author_team_member_id uuid references public.team_members (id) on delete set null;
alter table public.content_items add column if not exists resource_media_id uuid references public.media_assets (id) on delete set null;
alter table public.content_items add column if not exists resource_label text not null default '';

do $$ begin
  alter table public.content_items add constraint content_items_duration_check check (duration_minutes is null or duration_minutes > 0);
exception when duplicate_object then null; end $$;
