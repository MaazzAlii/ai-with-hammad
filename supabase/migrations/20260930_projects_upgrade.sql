-- Projects/case-studies upgrade batch (2026-09-30): client logo, status, duration,
-- extra narrative sections, an "integration" tag kind, and testimonial linking.
-- Run once in the Supabase SQL editor; safe to re-run.

alter type public.tag_kind add value if not exists 'integration';

do $$ begin
  create type public.project_status as enum ('live', 'in_progress', 'archived');
exception when duplicate_object then null; end $$;

alter table public.projects add column if not exists client_logo_media_id uuid references public.media_assets (id) on delete set null;
alter table public.projects add column if not exists duration_label text not null default '';
alter table public.projects add column if not exists status public.project_status not null default 'live';
alter table public.projects add column if not exists challenges text not null default '';
alter table public.projects add column if not exists lessons_learned text not null default '';
alter table public.projects add column if not exists scalability_notes text not null default '';
alter table public.projects add column if not exists security_measures text not null default '';
alter table public.projects add column if not exists feedback_process text not null default '';
alter table public.projects add column if not exists future_roadmap text not null default '';
alter table public.projects add column if not exists roi_summary text not null default '';
