-- Sponsorship/Brands upgrade batch (2026-09-30): result headlines,
-- exclusivity notes, brand testimonials, and job-title/traffic stats
-- (stored in site_settings, no schema change needed for those).
-- Run once in the Supabase SQL editor; safe to re-run.

alter table public.sponsorship_partners add column if not exists result_headline text not null default '';
alter table public.sponsorship_packages add column if not exists exclusivity_notes text not null default '';
alter table public.testimonials add column if not exists sponsorship_partner_id uuid references public.sponsorship_partners (id) on delete set null;
