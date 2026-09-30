-- Contact page upgrade batch (2026-09-30): department routing, NDA flag,
-- and a project-brief link field.
-- Run once in the Supabase SQL editor; safe to re-run.

alter table public.contact_inquiries add column if not exists department text not null default '';
alter table public.contact_inquiries add column if not exists wants_nda boolean not null default false;
alter table public.contact_inquiries add column if not exists brief_url text;

do $$ begin
  alter table public.contact_inquiries add constraint contact_inquiries_brief_url_check check (brief_url is null or brief_url ~* '^https?://');
exception when duplicate_object then null; end $$;
