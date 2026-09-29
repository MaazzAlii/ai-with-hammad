-- Services page upgrade batch (2026-09-30): pricing, tech stack, add-ons and
-- extra detail sections. Run once in the Supabase SQL editor; safe to re-run.

alter table public.services add column if not exists starting_at_price text not null default '';
alter table public.services add column if not exists timeline_estimate text not null default '';
alter table public.services add column if not exists ideal_for text not null default '';
alter table public.services add column if not exists tech_stack text[] not null default '{}';
alter table public.services add column if not exists video_url text;
alter table public.services add column if not exists engagement_terms text not null default '';
alter table public.services add column if not exists sla_notes text not null default '';
alter table public.services add column if not exists comparison_notes text not null default '';
alter table public.services add column if not exists process_notes text not null default '';
alter table public.services add column if not exists technical_notes text not null default '';
alter table public.services add column if not exists training_and_docs text not null default '';

create table if not exists public.service_add_ons (
  id          uuid primary key default gen_random_uuid(),
  service_id  uuid        not null references public.services (id) on delete cascade,
  title       text        not null,
  description text        not null default '',
  price_note  text        not null default '',
  sort_order  integer     not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists service_add_ons_service_idx on public.service_add_ons (service_id, sort_order);

alter table public.service_add_ons enable row level security;

select private.apply_content_policies('service_add_ons',
  'exists (select 1 from public.services s where s.id = service_id and s.is_published and s.deleted_at is null)',
  'services.write', 'services.write');
