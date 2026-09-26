-- =============================================================================
-- AI WITH HAMAD — Supabase database setup
-- =============================================================================
-- Canonical, idempotent setup for the AI With Hamad platform.
--
--   * Run in the Supabase SQL Editor (or `psql`) as the `postgres` role.
--   * Safe to re-run: every statement is guarded (IF NOT EXISTS / OR REPLACE /
--     DROP POLICY IF EXISTS / ON CONFLICT).
--   * Contains NO passwords, API keys or secrets.
--   * Keep in sync with src/db/schema.ts — tests/db/schema-consistency.test.ts
--     fails if they drift.
--
-- Sections
--   0. Extensions & schemas
--   1. Enums
--   2. Utility functions
--   3. Tables (+ indexes, triggers)
--   4. Access-control helpers (private schema)
--   5. Auth integration (profile trigger)
--   6. Row Level Security
--   7. Storage buckets & policies
--   8. Seed data (roles, permissions, settings, navigation, legal, services)
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 0. Extensions & schemas
-- -----------------------------------------------------------------------------
create extension if not exists pgcrypto with schema extensions;

-- `private` is NOT exposed through the Supabase Data API. Security-definer
-- helpers live here so they cannot be called over REST.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated, anon, service_role;

-- -----------------------------------------------------------------------------
-- 1. Enums
-- -----------------------------------------------------------------------------
do $$ begin
  create type public.app_role as enum ('owner', 'admin', 'manager', 'editor', 'viewer');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.inquiry_status as enum ('new', 'contacted', 'qualified', 'proposal', 'won', 'lost', 'archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.inquiry_priority as enum ('low', 'normal', 'high', 'urgent');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.content_platform as enum ('tiktok', 'youtube', 'instagram', 'facebook', 'linkedin', 'x', 'other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.media_kind as enum ('image', 'video', 'document', 'other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.project_media_type as enum (
    'image', 'screenshot', 'diagram', 'video_upload', 'youtube', 'vimeo', 'external', 'document'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.tag_kind as enum ('technology', 'topic');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.nav_location as enum ('header', 'footer', 'legal');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.account_kind as enum ('staff', 'client');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.thread_status as enum ('open', 'closed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.testimonial_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null; end $$;

-- -----------------------------------------------------------------------------
-- 2. Utility functions
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Helper to (re)create the updated_at trigger on a table idempotently.
create or replace function private.ensure_updated_at_trigger(tbl regclass)
returns void
language plpgsql
set search_path = ''
as $$
declare
  trg text := 'set_updated_at';
begin
  if not exists (
    select 1 from pg_trigger where tgrelid = tbl and tgname = trg and not tgisinternal
  ) then
    execute format(
      'create trigger %I before update on %s for each row execute function public.set_updated_at()',
      trg, tbl
    );
  end if;
end;
$$;

-- -----------------------------------------------------------------------------
-- 3. Tables
-- -----------------------------------------------------------------------------

-- 3.1 Identity & access -------------------------------------------------------
create table if not exists public.roles (
  key         public.app_role primary key,
  name        text        not null,
  description text        not null default '',
  rank        integer     not null,            -- higher = more privileged
  created_at  timestamptz not null default now(),
  constraint roles_rank_unique unique (rank)
);

create table if not exists public.permissions (
  key         text primary key,
  description text        not null default '',
  created_at  timestamptz not null default now(),
  constraint permissions_key_format check (key ~ '^[a-z]+(\.[a-z_]+)+$')
);

create table if not exists public.role_permissions (
  role           public.app_role not null references public.roles (key) on delete cascade,
  permission_key text            not null references public.permissions (key) on delete cascade,
  primary key (role, permission_key)
);
create index if not exists role_permissions_permission_idx on public.role_permissions (permission_key);

create table if not exists public.profiles (
  id              uuid primary key references auth.users (id) on delete cascade,
  email           text            not null,
  full_name       text            not null default '',
  avatar_url      text,
  role            public.app_role not null default 'viewer' references public.roles (key),
  kind            public.account_kind not null default 'staff',
  is_active       boolean         not null default false,
  last_sign_in_at timestamptz,
  created_at      timestamptz     not null default now(),
  updated_at      timestamptz     not null default now()
);
-- Upgrade path for databases created before the client portal existed.
alter table public.profiles add column if not exists kind public.account_kind not null default 'staff';
create unique index if not exists profiles_email_unique on public.profiles (lower(email));
create index if not exists profiles_role_idx on public.profiles (role);
select private.ensure_updated_at_trigger('public.profiles');

-- 3.2 Media ------------------------------------------------------------------
create table if not exists public.media_assets (
  id                uuid primary key default gen_random_uuid(),
  bucket            text              not null,
  path              text              not null,
  filename          text              not null,             -- display name (renamable)
  original_filename text              not null,
  mime_type         text              not null,
  kind              public.media_kind not null,
  size_bytes        bigint            not null check (size_bytes >= 0),
  width             integer           check (width is null or width > 0),
  height            integer           check (height is null or height > 0),
  duration_seconds  numeric(10, 2)    check (duration_seconds is null or duration_seconds >= 0),
  alt_text          text              not null default '',
  caption           text              not null default '',
  is_public         boolean           not null default true,
  uploaded_by       uuid              references public.profiles (id) on delete set null,
  created_at        timestamptz       not null default now(),
  updated_at        timestamptz       not null default now(),
  deleted_at        timestamptz,
  constraint media_assets_bucket_path_unique unique (bucket, path),
  constraint media_assets_path_safe check (path !~ '(^/|\.\.|//)')
);
create index if not exists media_assets_kind_idx on public.media_assets (kind) where deleted_at is null;
create index if not exists media_assets_created_idx on public.media_assets (created_at desc) where deleted_at is null;
create index if not exists media_assets_uploaded_by_idx on public.media_assets (uploaded_by);
select private.ensure_updated_at_trigger('public.media_assets');

-- 3.3 Services ---------------------------------------------------------------
create table if not exists public.services (
  id              uuid primary key default gen_random_uuid(),
  slug            text        not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title           text        not null,
  summary         text        not null default '',
  description     text        not null default '',
  icon            text        not null default 'sparkles',
  cover_media_id  uuid        references public.media_assets (id) on delete set null,
  seo_title       text,
  seo_description text,
  is_published    boolean     not null default false,
  published_at    timestamptz,
  is_featured     boolean     not null default false,
  sort_order      integer     not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);
create unique index if not exists services_slug_unique on public.services (slug) where deleted_at is null;
create index if not exists services_public_idx on public.services (is_published, sort_order) where deleted_at is null;
create index if not exists services_cover_idx on public.services (cover_media_id);
select private.ensure_updated_at_trigger('public.services');

create table if not exists public.service_features (
  id          uuid primary key default gen_random_uuid(),
  service_id  uuid        not null references public.services (id) on delete cascade,
  title       text        not null,
  description text        not null default '',
  sort_order  integer     not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists service_features_service_idx on public.service_features (service_id, sort_order);

-- 3.4 Team -------------------------------------------------------------------
create table if not exists public.team_members (
  id              uuid primary key default gen_random_uuid(),
  slug            text        not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name            text        not null,
  role_title      text        not null default '',
  bio             text        not null default '',
  long_bio        text        not null default '',
  photo_media_id  uuid        references public.media_assets (id) on delete set null,
  skills          text[]      not null default '{}',
  location        text        not null default '',
  website_url     text,
  is_published    boolean     not null default false,
  published_at    timestamptz,
  is_featured     boolean     not null default false,
  sort_order      integer     not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);
-- Locked members (the founders) cannot be renamed, re-slugged, unlocked or deleted.
alter table public.team_members add column if not exists is_locked boolean not null default false;
create unique index if not exists team_members_slug_unique on public.team_members (slug) where deleted_at is null;
create index if not exists team_members_public_idx on public.team_members (is_published, sort_order) where deleted_at is null;
create index if not exists team_members_photo_idx on public.team_members (photo_media_id);
select private.ensure_updated_at_trigger('public.team_members');

create table if not exists public.team_social_links (
  id             uuid primary key default gen_random_uuid(),
  team_member_id uuid        not null references public.team_members (id) on delete cascade,
  platform       text        not null,   -- github | linkedin | x | youtube | website | other …
  url            text        not null check (url ~* '^https?://'),
  label          text        not null default '',
  sort_order     integer     not null default 0,
  created_at     timestamptz not null default now()
);
create index if not exists team_social_links_member_idx on public.team_social_links (team_member_id, sort_order);

-- 3.5 Projects ---------------------------------------------------------------
create table if not exists public.projects (
  id              uuid primary key default gen_random_uuid(),
  slug            text        not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title           text        not null,
  subtitle        text        not null default '',
  summary         text        not null default '',
  category        text        not null default '',
  client_name     text        not null default '',
  industry        text        not null default '',
  project_year    integer     check (project_year is null or project_year between 1990 and 2100),
  project_url     text        check (project_url is null or project_url ~* '^https?://'),
  repository_url  text        check (repository_url is null or repository_url ~* '^https?://'),
  cover_media_id  uuid        references public.media_assets (id) on delete set null,
  overview        text        not null default '',
  problem         text        not null default '',
  approach        text        not null default '',
  architecture    text        not null default '',
  implementation  text        not null default '',
  results         text        not null default '',
  seo_title       text,
  seo_description text,
  is_published    boolean     not null default false,
  published_at    timestamptz,
  is_featured     boolean     not null default false,
  is_pinned       boolean     not null default false,
  sort_order      integer     not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);
create unique index if not exists projects_slug_unique on public.projects (slug) where deleted_at is null;
create index if not exists projects_public_idx on public.projects (is_published, sort_order) where deleted_at is null;
create index if not exists projects_pinned_idx on public.projects (is_pinned, sort_order) where deleted_at is null and is_published;
create index if not exists projects_category_idx on public.projects (category) where deleted_at is null;
create index if not exists projects_cover_idx on public.projects (cover_media_id);
select private.ensure_updated_at_trigger('public.projects');

create table if not exists public.project_media (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid                      not null references public.projects (id) on delete cascade,
  type            public.project_media_type not null,
  media_asset_id  uuid                      references public.media_assets (id) on delete restrict,
  external_url    text                      check (external_url is null or external_url ~* '^https://'),
  poster_media_id uuid                      references public.media_assets (id) on delete set null,
  title           text                      not null default '',
  caption         text                      not null default '',
  alt_text        text                      not null default '',
  sort_order      integer                   not null default 0,
  created_at      timestamptz               not null default now(),
  constraint project_media_source check (
    (type in ('youtube', 'vimeo', 'external') and external_url is not null)
    or (type not in ('youtube', 'vimeo', 'external') and media_asset_id is not null)
  )
);
create index if not exists project_media_project_idx on public.project_media (project_id, sort_order);
create index if not exists project_media_asset_idx on public.project_media (media_asset_id);
create index if not exists project_media_poster_idx on public.project_media (poster_media_id);

create table if not exists public.project_metrics (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid        not null references public.projects (id) on delete cascade,
  label       text        not null,
  value       text        not null,
  description text        not null default '',
  sort_order  integer     not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists project_metrics_project_idx on public.project_metrics (project_id, sort_order);

create table if not exists public.project_tags (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid            not null references public.projects (id) on delete cascade,
  kind       public.tag_kind not null default 'technology',
  label      text            not null,
  slug       text            not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  sort_order integer         not null default 0,
  constraint project_tags_unique unique (project_id, kind, slug)
);
create index if not exists project_tags_slug_idx on public.project_tags (kind, slug);

create table if not exists public.project_features (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid        not null references public.projects (id) on delete cascade,
  title       text        not null,
  description text        not null default '',
  sort_order  integer     not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists project_features_project_idx on public.project_features (project_id, sort_order);

create table if not exists public.project_team_members (
  project_id      uuid    not null references public.projects (id) on delete cascade,
  team_member_id  uuid    not null references public.team_members (id) on delete cascade,
  role_on_project text    not null default '',
  sort_order      integer not null default 0,
  primary key (project_id, team_member_id)
);
create index if not exists project_team_members_member_idx on public.project_team_members (team_member_id);

create table if not exists public.project_services (
  project_id uuid not null references public.projects (id) on delete cascade,
  service_id uuid not null references public.services (id) on delete cascade,
  primary key (project_id, service_id)
);
create index if not exists project_services_service_idx on public.project_services (service_id);

-- 3.6 Content creator --------------------------------------------------------
create table if not exists public.social_platforms (
  id                   uuid primary key default gen_random_uuid(),
  platform             public.content_platform not null,
  handle               text        not null,
  display_name         text        not null default '',
  profile_url          text        not null check (profile_url ~* '^https://'),
  description          text        not null default '',
  followers            bigint      check (followers is null or followers >= 0),
  followers_updated_at date,
  is_active            boolean     not null default true,
  sort_order           integer     not null default 0,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  constraint social_platforms_unique unique (platform, handle)
);
select private.ensure_updated_at_trigger('public.social_platforms');

create table if not exists public.content_items (
  id                  uuid primary key default gen_random_uuid(),
  slug                text        not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title               text        not null,
  platform            public.content_platform not null,
  social_platform_id  uuid        references public.social_platforms (id) on delete set null,
  url                 text        not null check (url ~* '^https://'),
  embed_url           text        check (embed_url is null or embed_url ~* '^https://'),
  thumbnail_media_id  uuid        references public.media_assets (id) on delete set null,
  description         text        not null default '',
  published_date      date,
  category            text        not null default '',
  is_featured         boolean     not null default false,
  is_high_performing  boolean     not null default false,
  is_campaign         boolean     not null default false,
  is_case_study       boolean     not null default false,
  performance_rank    integer     check (performance_rank is null or performance_rank > 0),
  is_published        boolean     not null default false,
  published_at        timestamptz,
  sort_order          integer     not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  deleted_at          timestamptz
);
create unique index if not exists content_items_slug_unique on public.content_items (slug) where deleted_at is null;
create index if not exists content_items_public_idx on public.content_items (is_published, sort_order) where deleted_at is null;
create index if not exists content_items_platform_idx on public.content_items (platform) where deleted_at is null;
create index if not exists content_items_date_idx on public.content_items (published_date desc) where deleted_at is null;
create index if not exists content_items_social_idx on public.content_items (social_platform_id);
create index if not exists content_items_thumb_idx on public.content_items (thumbnail_media_id);
select private.ensure_updated_at_trigger('public.content_items');

-- Metric snapshots (manual now; official API providers later). Latest row wins.
create table if not exists public.content_metrics (
  id              uuid primary key default gen_random_uuid(),
  content_item_id uuid          not null references public.content_items (id) on delete cascade,
  captured_at     timestamptz   not null default now(),
  views           bigint        check (views is null or views >= 0),
  likes           bigint        check (likes is null or likes >= 0),
  comments        bigint        check (comments is null or comments >= 0),
  shares          bigint        check (shares is null or shares >= 0),
  engagement_rate numeric(6, 3) check (engagement_rate is null or engagement_rate >= 0),
  source          text          not null default 'manual',
  created_at      timestamptz   not null default now()
);
create index if not exists content_metrics_item_idx on public.content_metrics (content_item_id, captured_at desc);

-- 3.7 Sponsorship ------------------------------------------------------------
create table if not exists public.sponsorship_partners (
  id               uuid primary key default gen_random_uuid(),
  name             text        not null,
  slug             text        not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  logo_media_id    uuid        references public.media_assets (id) on delete set null,
  website_url      text        check (website_url is null or website_url ~* '^https?://'),
  description      text        not null default '',
  campaign_summary text        not null default '',
  partnered_on     date,
  is_published     boolean     not null default false,
  sort_order       integer     not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz
);
create unique index if not exists sponsorship_partners_slug_unique on public.sponsorship_partners (slug) where deleted_at is null;
create index if not exists sponsorship_partners_logo_idx on public.sponsorship_partners (logo_media_id);
select private.ensure_updated_at_trigger('public.sponsorship_partners');

-- Public package information only. NO prices here.
create table if not exists public.sponsorship_packages (
  id           uuid primary key default gen_random_uuid(),
  slug         text        not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name         text        not null,
  summary      text        not null default '',
  deliverables text[]      not null default '{}',
  platforms    public.content_platform[] not null default '{}',
  is_published boolean     not null default false,
  sort_order   integer     not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz
);
create unique index if not exists sponsorship_packages_slug_unique on public.sponsorship_packages (slug) where deleted_at is null;
select private.ensure_updated_at_trigger('public.sponsorship_packages');

-- INTERNAL rates. Never exposed publicly (no anon policy; staff with sponsorship.rates only).
create table if not exists public.sponsorship_package_rates (
  package_id        uuid primary key references public.sponsorship_packages (id) on delete cascade,
  currency          char(3)       not null default 'USD' check (currency ~ '^[A-Z]{3}$'),
  standard_rate     numeric(12, 2) check (standard_rate is null or standard_rate >= 0),
  minimum_rate      numeric(12, 2) check (minimum_rate is null or minimum_rate >= 0),
  package_notes     text          not null default '',
  negotiation_notes text          not null default '',
  updated_by        uuid          references public.profiles (id) on delete set null,
  created_at        timestamptz   not null default now(),
  updated_at        timestamptz   not null default now(),
  constraint sponsorship_rates_min_le_standard check (
    minimum_rate is null or standard_rate is null or minimum_rate <= standard_rate
  )
);
select private.ensure_updated_at_trigger('public.sponsorship_package_rates');

create table if not exists public.sponsorship_inquiries (
  id             uuid primary key default gen_random_uuid(),
  name           text                    not null,
  email          text                    not null,
  company        text                    not null default '',
  website        text                    not null default '',
  package_id     uuid                    references public.sponsorship_packages (id) on delete set null,
  platforms      public.content_platform[] not null default '{}',
  budget_range   text                    not null default '',
  timeline       text                    not null default '',
  campaign_goals text                    not null default '',
  message        text                    not null,
  status         public.inquiry_status   not null default 'new',
  priority       public.inquiry_priority not null default 'normal',
  assigned_to    uuid                    references public.profiles (id) on delete set null,
  source_path    text                    not null default '',
  ip_hash        text,
  user_agent     text                    not null default '',
  email_status   text                    not null default 'pending',  -- pending | sent | failed | skipped
  contacted_at   timestamptz,
  closed_at      timestamptz,
  created_at     timestamptz             not null default now(),
  updated_at     timestamptz             not null default now()
);
create index if not exists sponsorship_inquiries_status_idx on public.sponsorship_inquiries (status, created_at desc);
create index if not exists sponsorship_inquiries_assigned_idx on public.sponsorship_inquiries (assigned_to);
create index if not exists sponsorship_inquiries_package_idx on public.sponsorship_inquiries (package_id);
select private.ensure_updated_at_trigger('public.sponsorship_inquiries');

-- 3.8 CRM --------------------------------------------------------------------
create table if not exists public.contact_inquiries (
  id            uuid primary key default gen_random_uuid(),
  name          text                    not null,
  email         text                    not null,
  company       text                    not null default '',
  phone         text                    not null default '',
  service_id    uuid                    references public.services (id) on delete set null,
  service_label text                    not null default '',
  budget        text                    not null default '',
  timeline      text                    not null default '',
  message       text                    not null,
  status        public.inquiry_status   not null default 'new',
  priority      public.inquiry_priority not null default 'normal',
  assigned_to   uuid                    references public.profiles (id) on delete set null,
  source_path   text                    not null default '',
  ip_hash       text,
  user_agent    text                    not null default '',
  email_status  text                    not null default 'pending',
  contacted_at  timestamptz,
  closed_at     timestamptz,
  created_at    timestamptz             not null default now(),
  updated_at    timestamptz             not null default now()
);
create index if not exists contact_inquiries_status_idx on public.contact_inquiries (status, created_at desc);
create index if not exists contact_inquiries_assigned_idx on public.contact_inquiries (assigned_to);
create index if not exists contact_inquiries_service_idx on public.contact_inquiries (service_id);
select private.ensure_updated_at_trigger('public.contact_inquiries');

create table if not exists public.inquiry_notes (
  id                     uuid primary key default gen_random_uuid(),
  contact_inquiry_id     uuid references public.contact_inquiries (id) on delete cascade,
  sponsorship_inquiry_id uuid references public.sponsorship_inquiries (id) on delete cascade,
  author_id              uuid references public.profiles (id) on delete set null,
  body                   text        not null check (length(body) between 1 and 5000),
  created_at             timestamptz not null default now(),
  constraint inquiry_notes_one_parent check (num_nonnulls(contact_inquiry_id, sponsorship_inquiry_id) = 1)
);
create index if not exists inquiry_notes_contact_idx on public.inquiry_notes (contact_inquiry_id, created_at);
create index if not exists inquiry_notes_sponsorship_idx on public.inquiry_notes (sponsorship_inquiry_id, created_at);
create index if not exists inquiry_notes_author_idx on public.inquiry_notes (author_id);

-- 3.8b Client portal ---------------------------------------------------------
create table if not exists public.clients (
  id           uuid primary key default gen_random_uuid(),
  company_name text        not null check (length(company_name) between 1 and 160),
  contact_name text        not null default '',
  email        text        not null default '',
  phone        text        not null default '',
  whatsapp     text        not null default '',
  notes        text        not null default '',   -- internal, staff only
  is_active    boolean     not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists clients_active_idx on public.clients (is_active, company_name);
select private.ensure_updated_at_trigger('public.clients');

-- A portal user (profiles.kind = 'client') belongs to exactly one client.
alter table public.profiles add column if not exists client_id uuid references public.clients (id) on delete set null;
create index if not exists profiles_client_idx on public.profiles (client_id);

create table if not exists public.message_threads (
  id                  uuid primary key default gen_random_uuid(),
  client_id           uuid                 not null references public.clients (id) on delete cascade,
  subject             text                 not null check (length(subject) between 1 and 200),
  status              public.thread_status not null default 'open',
  project_id          uuid                 references public.projects (id) on delete set null,
  created_by          uuid                 references public.profiles (id) on delete set null,
  last_message_at     timestamptz          not null default now(),
  staff_last_read_at  timestamptz,
  client_last_read_at timestamptz,
  created_at          timestamptz          not null default now(),
  updated_at          timestamptz          not null default now()
);
create index if not exists message_threads_client_idx on public.message_threads (client_id, last_message_at desc);
create index if not exists message_threads_recent_idx on public.message_threads (last_message_at desc);
create index if not exists message_threads_project_idx on public.message_threads (project_id);
create index if not exists message_threads_created_by_idx on public.message_threads (created_by);
select private.ensure_updated_at_trigger('public.message_threads');

create table if not exists public.messages (
  id          uuid primary key default gen_random_uuid(),
  thread_id   uuid                not null references public.message_threads (id) on delete cascade,
  author_id   uuid                references public.profiles (id) on delete set null,
  author_kind public.account_kind not null,
  body        text                not null check (length(body) between 1 and 5000),
  created_at  timestamptz         not null default now()
);
create index if not exists messages_thread_idx on public.messages (thread_id, created_at);
create index if not exists messages_author_idx on public.messages (author_id);

-- 3.8c Testimonials & FAQ -----------------------------------------------------
create table if not exists public.testimonials (
  id                 uuid primary key default gen_random_uuid(),
  client_id          uuid                      references public.clients (id) on delete set null,
  project_id         uuid                      references public.projects (id) on delete set null,
  submitted_by       uuid                      references public.profiles (id) on delete set null,
  source             text                      not null default 'portal' check (source in ('portal', 'manual')),
  author_name        text                      not null check (length(author_name) between 1 and 120),
  author_title       text                      not null default '',
  company            text                      not null default '',
  quote              text                      not null check (length(quote) between 10 and 2000),
  rating             smallint                  not null check (rating between 1 and 5),
  photo_media_id     uuid                      references public.media_assets (id) on delete set null,
  consent_to_publish boolean                   not null default false,
  status             public.testimonial_status not null default 'pending',
  is_published       boolean                   not null default false,
  is_featured        boolean                   not null default false,
  sort_order         integer                   not null default 0,
  published_at       timestamptz,
  created_at         timestamptz               not null default now(),
  updated_at         timestamptz               not null default now(),
  deleted_at         timestamptz,
  -- Only approved testimonials whose author consented can ever be public.
  constraint testimonials_publish_requires_approval check (not is_published or (status = 'approved' and consent_to_publish))
);
create index if not exists testimonials_public_idx on public.testimonials (is_published, sort_order) where deleted_at is null;
create index if not exists testimonials_status_idx on public.testimonials (status, created_at desc);
create index if not exists testimonials_client_idx on public.testimonials (client_id);
create index if not exists testimonials_project_idx on public.testimonials (project_id);
create index if not exists testimonials_submitted_by_idx on public.testimonials (submitted_by);
create index if not exists testimonials_photo_idx on public.testimonials (photo_media_id);
select private.ensure_updated_at_trigger('public.testimonials');

create table if not exists public.faqs (
  id           uuid primary key default gen_random_uuid(),
  question     text        not null check (length(question) between 3 and 300),
  answer       text        not null check (length(answer) between 1 and 4000),
  category     text        not null default '',
  is_published boolean     not null default true,
  sort_order   integer     not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz
);
create index if not exists faqs_public_idx on public.faqs (is_published, sort_order) where deleted_at is null;
select private.ensure_updated_at_trigger('public.faqs');

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

-- 3.9 Site -------------------------------------------------------------------
-- Keys starting with 'internal.' are never readable publicly.
create table if not exists public.site_settings (
  key        text primary key check (key ~ '^[a-z_]+(\.[a-z_]+)*$'),
  value      jsonb       not null default '{}'::jsonb,
  updated_by uuid        references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists site_settings_updated_by_idx on public.site_settings (updated_by);
select private.ensure_updated_at_trigger('public.site_settings');

create table if not exists public.navigation_items (
  id          uuid primary key default gen_random_uuid(),
  location    public.nav_location not null,
  label       text        not null,
  href        text        not null check (href ~ '^(/|https://)'),
  parent_id   uuid        references public.navigation_items (id) on delete cascade,
  is_external boolean     not null default false,
  is_visible  boolean     not null default true,
  sort_order  integer     not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists navigation_items_location_idx on public.navigation_items (location, sort_order);
create index if not exists navigation_items_parent_idx on public.navigation_items (parent_id);
select private.ensure_updated_at_trigger('public.navigation_items');

create table if not exists public.legal_documents (
  slug         text primary key check (slug in ('privacy-policy', 'terms', 'cookie-policy')),
  title        text        not null,
  body         text        not null default '',
  is_published boolean     not null default true,
  effective_on date,
  updated_by   uuid        references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists legal_documents_updated_by_idx on public.legal_documents (updated_by);
select private.ensure_updated_at_trigger('public.legal_documents');

-- 3.10 Ops -------------------------------------------------------------------
create table if not exists public.audit_logs (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid        references public.profiles (id) on delete set null,
  actor_email text        not null default '',
  action      text        not null check (action ~ '^[a-z_]+(\.[a-z_]+)*$'),
  entity_type text        not null default '',
  entity_id   text,
  summary     text        not null default '',
  metadata    jsonb       not null default '{}'::jsonb,
  ip_hash     text,
  created_at  timestamptz not null default now()
);
create index if not exists audit_logs_created_idx on public.audit_logs (created_at desc);
create index if not exists audit_logs_entity_idx on public.audit_logs (entity_type, entity_id);
create index if not exists audit_logs_actor_idx on public.audit_logs (actor_id, created_at desc);
create index if not exists audit_logs_action_idx on public.audit_logs (action);

-- Fixed-window rate limiting for public forms (serverless-safe).
create table if not exists public.rate_limits (
  key          text        not null,
  window_start timestamptz not null,
  count        integer     not null default 0,
  primary key (key, window_start)
);
create index if not exists rate_limits_window_idx on public.rate_limits (window_start);

-- -----------------------------------------------------------------------------
-- 4. Access-control helpers (private schema, security definer)
-- -----------------------------------------------------------------------------
create or replace function private.current_role_key()
returns public.app_role
language sql
stable
security definer
set search_path = ''
as $$
  select p.role
  from public.profiles p
  where p.id = (select auth.uid()) and p.is_active and p.kind = 'staff'
$$;

create or replace function private.has_permission(perm text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    join public.role_permissions rp on rp.role = p.role
    where p.id = (select auth.uid())
      and p.is_active
      and p.kind = 'staff'
      and rp.permission_key = perm
  )
$$;

revoke all on function private.current_role_key() from public;
revoke all on function private.has_permission(text) from public;
grant execute on function private.current_role_key() to authenticated;
grant execute on function private.has_permission(text) to authenticated;

-- The client a signed-in portal user belongs to (null for staff / inactive clients).
create or replace function private.current_client_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select p.client_id
  from public.profiles p
  join public.clients c on c.id = p.client_id
  where p.id = (select auth.uid())
    and p.kind = 'client'
    and p.is_active
    and c.is_active
$$;
revoke all on function private.current_client_id() from public;
grant execute on function private.current_client_id() to authenticated;

-- Founders' team entries: name/slug are fixed and the entry cannot be removed.
create or replace function private.protect_locked_team_members()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    if old.is_locked then
      raise exception 'This team member is locked and cannot be deleted';
    end if;
    return old;
  end if;
  if old.is_locked and (
       new.name is distinct from old.name
    or new.slug is distinct from old.slug
    or not new.is_locked
    or new.deleted_at is not null
  ) then
    raise exception 'This team member is locked: name and URL cannot be changed and it cannot be deleted';
  end if;
  return new;
end;
$$;

-- Atomic rate-limit hit: returns the count in the current window.
create or replace function private.rate_limit_hit(p_key text, p_window_seconds integer)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  w timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  c integer;
begin
  insert into public.rate_limits as r (key, window_start, count)
  values (p_key, w, 1)
  on conflict (key, window_start) do update set count = r.count + 1
  returning r.count into c;
  -- opportunistic cleanup of old windows
  delete from public.rate_limits where window_start < now() - interval '1 day';
  return c;
end;
$$;
revoke all on function private.rate_limit_hit(text, integer) from public;

-- Run once from the SQL editor after creating your first user in the Auth dashboard:
--   select private.promote_to_owner('you@example.com');
create or replace function private.promote_to_owner(p_email text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles
     set role = 'owner', is_active = true
   where lower(email) = lower(p_email);
  if not found then
    raise exception 'No profile for %. Create the user in Authentication > Users first.', p_email;
  end if;
end;
$$;
revoke all on function private.promote_to_owner(text) from public, anon, authenticated;

-- Safety net: never allow the last active owner to be demoted or deactivated.
create or replace function private.protect_last_owner()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.role = 'owner' and old.is_active
     and (new.role <> 'owner' or not new.is_active)
     and not exists (
       select 1 from public.profiles
        where role = 'owner' and is_active and id <> old.id
     ) then
    raise exception 'Cannot demote or deactivate the last active owner';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_locked_team_members on public.team_members;
create trigger protect_locked_team_members
  before update or delete on public.team_members
  for each row execute function private.protect_locked_team_members();

drop trigger if exists protect_last_owner on public.profiles;
create trigger protect_last_owner
  before update of role, is_active on public.profiles
  for each row execute function private.protect_last_owner();

-- -----------------------------------------------------------------------------
-- 5. Auth integration — every auth user gets an INACTIVE viewer profile.
--    Staff are activated by an admin (invite flow) — an accidental public
--    signup therefore gets no CMS access.
-- -----------------------------------------------------------------------------
create or replace function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_auth_user();

-- Keep profile email in sync with auth email changes.
create or replace function private.handle_auth_user_updated()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email is distinct from old.email then
    update public.profiles set email = coalesce(new.email, '') where id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
  after update of email on auth.users
  for each row execute function private.handle_auth_user_updated();

-- Backfill profiles for users that existed before this script ran.
insert into public.profiles (id, email, full_name)
select u.id, coalesce(u.email, ''), coalesce(u.raw_user_meta_data ->> 'full_name', '')
from auth.users u
on conflict (id) do nothing;

-- -----------------------------------------------------------------------------
-- 6. Row Level Security
-- -----------------------------------------------------------------------------
-- Pattern:
--   * RLS enabled on every table.
--   * anon/authenticated may SELECT published, non-deleted rows of PUBLIC tables.
--   * Staff access is granted by permission via private.has_permission().
--   * Tables with sensitive data have NO anon policy at all.
--   * The application server uses a direct Postgres connection (Drizzle) and
--     enforces the same rules in code (see src/server/auth/rbac.ts).

do $$
declare t text;
begin
  foreach t in array array[
    'roles','permissions','role_permissions','profiles','media_assets',
    'services','service_features','team_members','team_social_links',
    'projects','project_media','project_metrics','project_tags','project_features',
    'project_team_members','project_services',
    'social_platforms','content_items','content_metrics',
    'sponsorship_partners','sponsorship_packages','sponsorship_package_rates','sponsorship_inquiries',
    'clients','message_threads','messages','testimonials','faqs','bio_links',
    'contact_inquiries','inquiry_notes','site_settings','navigation_items','legal_documents',
    'audit_logs','rate_limits'
  ] loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- Sensitive tables: remove default Data API privileges from anon entirely.
revoke all on public.clients, public.message_threads, public.messages from anon;
revoke all on public.sponsorship_package_rates, public.sponsorship_inquiries, public.contact_inquiries,
              public.inquiry_notes, public.audit_logs, public.rate_limits, public.profiles
  from anon;

-- 6.1 Reference tables: readable by staff ------------------------------------
drop policy if exists "staff read roles" on public.roles;
create policy "staff read roles" on public.roles
  for select to authenticated using ((select private.has_permission('cms.read')));

drop policy if exists "staff read permissions" on public.permissions;
create policy "staff read permissions" on public.permissions
  for select to authenticated using ((select private.has_permission('cms.read')));

drop policy if exists "staff read role_permissions" on public.role_permissions;
create policy "staff read role_permissions" on public.role_permissions
  for select to authenticated using ((select private.has_permission('cms.read')));

-- 6.2 Profiles ----------------------------------------------------------------
drop policy if exists "read own profile" on public.profiles;
create policy "read own profile" on public.profiles
  for select to authenticated using (id = (select auth.uid()));

drop policy if exists "user admins read profiles" on public.profiles;
create policy "user admins read profiles" on public.profiles
  for select to authenticated using ((select private.has_permission('users.read')));

drop policy if exists "user admins update profiles" on public.profiles;
create policy "user admins update profiles" on public.profiles
  for update to authenticated
  using ((select private.has_permission('users.manage')))
  with check ((select private.has_permission('users.manage')));

-- 6.3 Generic public-content policies (macro) -------------------------------
create or replace function private.apply_content_policies(
  tbl text, public_filter text, write_perm text, delete_perm text
) returns void
language plpgsql
set search_path = ''
as $$
begin
  execute format('drop policy if exists "public read" on public.%I', tbl);
  if public_filter is not null then
    execute format(
      'create policy "public read" on public.%I for select to anon, authenticated using (%s)',
      tbl, public_filter);
  end if;
  execute format('drop policy if exists "staff read" on public.%I', tbl);
  execute format(
    'create policy "staff read" on public.%I for select to authenticated using ((select private.has_permission(''cms.read'')))',
    tbl);
  execute format('drop policy if exists "staff insert" on public.%I', tbl);
  execute format(
    'create policy "staff insert" on public.%I for insert to authenticated with check ((select private.has_permission(%L)))',
    tbl, write_perm);
  execute format('drop policy if exists "staff update" on public.%I', tbl);
  execute format(
    'create policy "staff update" on public.%I for update to authenticated using ((select private.has_permission(%L))) with check ((select private.has_permission(%L)))',
    tbl, write_perm, write_perm);
  execute format('drop policy if exists "staff delete" on public.%I', tbl);
  execute format(
    'create policy "staff delete" on public.%I for delete to authenticated using ((select private.has_permission(%L)))',
    tbl, delete_perm);
end;
$$;
revoke all on function private.apply_content_policies(text, text, text, text) from public, anon, authenticated;

select private.apply_content_policies('services',
  'is_published and deleted_at is null', 'services.write', 'services.delete');
select private.apply_content_policies('service_features',
  'exists (select 1 from public.services s where s.id = service_id and s.is_published and s.deleted_at is null)',
  'services.write', 'services.write');

select private.apply_content_policies('team_members',
  'is_published and deleted_at is null', 'team.write', 'team.delete');
select private.apply_content_policies('team_social_links',
  'exists (select 1 from public.team_members m where m.id = team_member_id and m.is_published and m.deleted_at is null)',
  'team.write', 'team.write');

select private.apply_content_policies('projects',
  'is_published and deleted_at is null', 'projects.write', 'projects.delete');
select private.apply_content_policies('project_media',
  'exists (select 1 from public.projects p where p.id = project_id and p.is_published and p.deleted_at is null)',
  'projects.write', 'projects.write');
select private.apply_content_policies('project_metrics',
  'exists (select 1 from public.projects p where p.id = project_id and p.is_published and p.deleted_at is null)',
  'projects.write', 'projects.write');
select private.apply_content_policies('project_tags',
  'exists (select 1 from public.projects p where p.id = project_id and p.is_published and p.deleted_at is null)',
  'projects.write', 'projects.write');
select private.apply_content_policies('project_features',
  'exists (select 1 from public.projects p where p.id = project_id and p.is_published and p.deleted_at is null)',
  'projects.write', 'projects.write');
select private.apply_content_policies('project_team_members',
  'exists (select 1 from public.projects p where p.id = project_id and p.is_published and p.deleted_at is null)',
  'projects.write', 'projects.write');
select private.apply_content_policies('project_services',
  'exists (select 1 from public.projects p where p.id = project_id and p.is_published and p.deleted_at is null)',
  'projects.write', 'projects.write');

select private.apply_content_policies('social_platforms', 'is_active', 'content.write', 'content.delete');
select private.apply_content_policies('content_items',
  'is_published and deleted_at is null', 'content.write', 'content.delete');
select private.apply_content_policies('content_metrics',
  'exists (select 1 from public.content_items c where c.id = content_item_id and c.is_published and c.deleted_at is null)',
  'content.write', 'content.write');

select private.apply_content_policies('sponsorship_partners',
  'is_published and deleted_at is null', 'sponsorship.write', 'sponsorship.delete');
select private.apply_content_policies('sponsorship_packages',
  'is_published and deleted_at is null', 'sponsorship.write', 'sponsorship.delete');

select private.apply_content_policies('media_assets',
  'is_public and deleted_at is null', 'media.update', 'media.delete');
-- uploads create media rows → insert needs media.upload rather than media.update
drop policy if exists "staff insert" on public.media_assets;
create policy "staff insert" on public.media_assets
  for insert to authenticated with check ((select private.has_permission('media.upload')));

select private.apply_content_policies('navigation_items', 'is_visible', 'navigation.write', 'navigation.write');
select private.apply_content_policies('legal_documents', 'is_published', 'legal.write', 'legal.write');
select private.apply_content_policies('site_settings',
  'key not like ''internal.%''', 'settings.write', 'settings.write');

-- 6.4 Sensitive tables ------------------------------------------------------
-- Internal rates: sponsorship.rates only. No anon, no generic staff read.
drop policy if exists "rates read" on public.sponsorship_package_rates;
create policy "rates read" on public.sponsorship_package_rates
  for select to authenticated using ((select private.has_permission('sponsorship.rates')));
drop policy if exists "rates write" on public.sponsorship_package_rates;
create policy "rates write" on public.sponsorship_package_rates
  for all to authenticated
  using ((select private.has_permission('sponsorship.rates')))
  with check ((select private.has_permission('sponsorship.rates')));

-- Inquiries: created by the application server only (no public insert policy).
drop policy if exists "inquiries read" on public.contact_inquiries;
create policy "inquiries read" on public.contact_inquiries
  for select to authenticated using ((select private.has_permission('inquiries.read')));
drop policy if exists "inquiries update" on public.contact_inquiries;
create policy "inquiries update" on public.contact_inquiries
  for update to authenticated
  using ((select private.has_permission('inquiries.write')))
  with check ((select private.has_permission('inquiries.write')));
drop policy if exists "inquiries delete" on public.contact_inquiries;
create policy "inquiries delete" on public.contact_inquiries
  for delete to authenticated using ((select private.has_permission('inquiries.delete')));

drop policy if exists "inquiries read" on public.sponsorship_inquiries;
create policy "inquiries read" on public.sponsorship_inquiries
  for select to authenticated using ((select private.has_permission('inquiries.read')));
drop policy if exists "inquiries update" on public.sponsorship_inquiries;
create policy "inquiries update" on public.sponsorship_inquiries
  for update to authenticated
  using ((select private.has_permission('inquiries.write')))
  with check ((select private.has_permission('inquiries.write')));
drop policy if exists "inquiries delete" on public.sponsorship_inquiries;
create policy "inquiries delete" on public.sponsorship_inquiries
  for delete to authenticated using ((select private.has_permission('inquiries.delete')));

drop policy if exists "notes read" on public.inquiry_notes;
create policy "notes read" on public.inquiry_notes
  for select to authenticated using ((select private.has_permission('inquiries.read')));
drop policy if exists "notes insert" on public.inquiry_notes;
create policy "notes insert" on public.inquiry_notes
  for insert to authenticated
  with check ((select private.has_permission('inquiries.write')) and author_id = (select auth.uid()));

drop policy if exists "audit read" on public.audit_logs;
create policy "audit read" on public.audit_logs
  for select to authenticated using ((select private.has_permission('audit.read')));
-- audit_logs: no insert/update/delete policies → append-only from the server.

-- rate_limits: no policies → inaccessible through the Data API.

-- 6.5 Client portal ---------------------------------------------------------
drop policy if exists "staff read clients" on public.clients;
create policy "staff read clients" on public.clients
  for select to authenticated using ((select private.has_permission('clients.read')));
drop policy if exists "staff manage clients" on public.clients;
create policy "staff manage clients" on public.clients
  for all to authenticated
  using ((select private.has_permission('clients.manage')))
  with check ((select private.has_permission('clients.manage')));
drop policy if exists "client reads own client" on public.clients;
create policy "client reads own client" on public.clients
  for select to authenticated using (id = (select private.current_client_id()));

drop policy if exists "staff read threads" on public.message_threads;
create policy "staff read threads" on public.message_threads
  for select to authenticated using ((select private.has_permission('messages.read')));
drop policy if exists "staff write threads" on public.message_threads;
create policy "staff write threads" on public.message_threads
  for all to authenticated
  using ((select private.has_permission('messages.write')))
  with check ((select private.has_permission('messages.write')));
drop policy if exists "client reads own threads" on public.message_threads;
create policy "client reads own threads" on public.message_threads
  for select to authenticated using (client_id = (select private.current_client_id()));
drop policy if exists "client creates own threads" on public.message_threads;
create policy "client creates own threads" on public.message_threads
  for insert to authenticated with check (client_id = (select private.current_client_id()) and created_by = (select auth.uid()));

drop policy if exists "staff read messages" on public.messages;
create policy "staff read messages" on public.messages
  for select to authenticated using ((select private.has_permission('messages.read')));
drop policy if exists "staff send messages" on public.messages;
create policy "staff send messages" on public.messages
  for insert to authenticated
  with check ((select private.has_permission('messages.write')) and author_id = (select auth.uid()) and author_kind = 'staff');
drop policy if exists "client reads own messages" on public.messages;
create policy "client reads own messages" on public.messages
  for select to authenticated
  using (exists (select 1 from public.message_threads t where t.id = thread_id and t.client_id = (select private.current_client_id())));
drop policy if exists "client sends own messages" on public.messages;
create policy "client sends own messages" on public.messages
  for insert to authenticated
  with check (
    author_id = (select auth.uid()) and author_kind = 'client'
    and exists (select 1 from public.message_threads t where t.id = thread_id and t.client_id = (select private.current_client_id()))
  );

-- 6.6 Testimonials & FAQ ----------------------------------------------------
select private.apply_content_policies('testimonials',
  'is_published and deleted_at is null', 'testimonials.moderate', 'testimonials.moderate');
drop policy if exists "client reads own testimonials" on public.testimonials;
create policy "client reads own testimonials" on public.testimonials
  for select to authenticated using (client_id = (select private.current_client_id()));
drop policy if exists "client submits testimonial" on public.testimonials;
create policy "client submits testimonial" on public.testimonials
  for insert to authenticated
  with check (
    client_id = (select private.current_client_id()) and submitted_by = (select auth.uid())
    and source = 'portal' and status = 'pending' and not is_published and not is_featured
  );

select private.apply_content_policies('faqs', 'is_published and deleted_at is null', 'faqs.write', 'faqs.write');
select private.apply_content_policies('bio_links',
  'is_published and deleted_at is null and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at > now())',
  'links.write', 'links.write');

-- -----------------------------------------------------------------------------
-- 7. Storage buckets & policies
-- -----------------------------------------------------------------------------
-- file_size_limit and allowed_mime_types are enforced by Supabase Storage
-- before an object is accepted (server-side validation). Keep in sync with
-- src/lib/media/buckets.ts. The project's global upload limit still applies.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('site-assets',        'site-assets',        true,  10485760,  array['image/jpeg','image/png','image/webp','image/gif','image/svg+xml','image/x-icon']),
  ('project-images',     'project-images',     true,  15728640,  array['image/jpeg','image/png','image/webp','image/gif']),
  ('project-gallery',    'project-gallery',    true,  15728640,  array['image/jpeg','image/png','image/webp','image/gif']),
  ('project-videos',     'project-videos',     true,  524288000, array['video/mp4','video/webm']),
  ('team-images',        'team-images',        true,  10485760,  array['image/jpeg','image/png','image/webp']),
  ('content-thumbnails', 'content-thumbnails', true,  10485760,  array['image/jpeg','image/png','image/webp']),
  ('content-media',      'content-media',      true,  524288000, array['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm']),
  ('sponsorship-media',  'sponsorship-media',  true,  52428800,  array['image/jpeg','image/png','image/webp','application/pdf']),
  ('media-library',      'media-library',      true,  524288000, array['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm','application/pdf']),
  ('private-documents',  'private-documents',  false, 52428800,  array['application/pdf','image/jpeg','image/png','image/webp'])
on conflict (id) do update set
  public             = excluded.public,
  file_size_limit    = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Public buckets serve files via /storage/v1/object/public/... without any
-- SELECT policy. We intentionally add NO anon SELECT policy so bucket
-- contents cannot be listed by anonymous users.
drop policy if exists "aiwh staff read objects" on storage.objects;
create policy "aiwh staff read objects" on storage.objects
  for select to authenticated
  using (
    bucket_id in ('site-assets','project-images','project-gallery','project-videos','team-images',
                  'content-thumbnails','content-media','sponsorship-media','media-library','private-documents')
    and (select private.has_permission('cms.read'))
  );

drop policy if exists "aiwh staff upload objects" on storage.objects;
create policy "aiwh staff upload objects" on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('project-images','project-gallery','project-videos','team-images',
                  'content-thumbnails','content-media','sponsorship-media','media-library','private-documents')
    and (select private.has_permission('media.upload'))
    and lower(storage.extension(name)) in ('jpg','jpeg','png','webp','gif','mp4','webm','pdf')
  );

-- site-assets (logos, favicons, SVG) is restricted to settings managers.
drop policy if exists "aiwh settings upload site assets" on storage.objects;
create policy "aiwh settings upload site assets" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'site-assets'
    and (select private.has_permission('settings.write'))
    and lower(storage.extension(name)) in ('jpg','jpeg','png','webp','gif','svg','ico')
  );

drop policy if exists "aiwh staff update objects" on storage.objects;
create policy "aiwh staff update objects" on storage.objects
  for update to authenticated
  using (
    bucket_id in ('site-assets','project-images','project-gallery','project-videos','team-images',
                  'content-thumbnails','content-media','sponsorship-media','media-library','private-documents')
    and (select private.has_permission('media.update'))
  )
  with check (
    bucket_id in ('site-assets','project-images','project-gallery','project-videos','team-images',
                  'content-thumbnails','content-media','sponsorship-media','media-library','private-documents')
    and (select private.has_permission('media.update'))
  );

drop policy if exists "aiwh staff delete objects" on storage.objects;
create policy "aiwh staff delete objects" on storage.objects
  for delete to authenticated
  using (
    bucket_id in ('site-assets','project-images','project-gallery','project-videos','team-images',
                  'content-thumbnails','content-media','sponsorship-media','media-library','private-documents')
    and (select private.has_permission('media.delete'))
  );

-- -----------------------------------------------------------------------------
-- 8. Seed data
-- -----------------------------------------------------------------------------
insert into public.roles (key, name, description, rank) values
  ('owner',   'Owner',   'Full control including ownership and all users.', 50),
  ('admin',   'Admin',   'Full CMS control, settings and user management (except owners).', 40),
  ('manager', 'Manager', 'Publishes content, manages inquiries and sponsorship rates.', 30),
  ('editor',  'Editor',  'Creates and edits drafts and uploads media. Cannot publish or delete.', 20),
  ('viewer',  'Viewer',  'Read-only access to CMS content (no inquiries, rates or audit logs).', 10)
on conflict (key) do update set name = excluded.name, description = excluded.description, rank = excluded.rank;

insert into public.permissions (key, description) values
  ('cms.read',            'Access the admin CMS and read content'),
  ('projects.write',      'Create and edit projects'),
  ('projects.publish',    'Publish, unpublish, feature, pin and reorder projects'),
  ('projects.delete',     'Delete projects'),
  ('services.write',      'Create and edit services'),
  ('services.publish',    'Publish, feature and reorder services'),
  ('services.delete',     'Delete services'),
  ('team.write',          'Create and edit team members'),
  ('team.publish',        'Publish, feature and reorder team members'),
  ('team.delete',         'Delete team members'),
  ('content.write',       'Create and edit content items and social platforms'),
  ('content.publish',     'Publish, feature, highlight and reorder content'),
  ('content.delete',      'Delete content items'),
  ('sponsorship.write',   'Edit sponsorship packages and partners'),
  ('sponsorship.publish', 'Publish sponsorship packages and partners'),
  ('sponsorship.delete',  'Delete sponsorship packages and partners'),
  ('sponsorship.rates',   'Read and edit INTERNAL sponsorship rates and negotiation notes'),
  ('inquiries.read',      'Read contact and sponsorship inquiries'),
  ('inquiries.write',     'Update inquiry status, priority, assignment and notes'),
  ('inquiries.delete',    'Delete inquiries'),
  ('media.upload',        'Upload media'),
  ('media.update',        'Rename, replace and edit media metadata'),
  ('media.delete',        'Delete media'),
  ('settings.write',      'Edit site settings and site assets'),
  ('navigation.write',    'Edit navigation'),
  ('legal.write',         'Edit legal documents'),
  ('users.read',          'View staff users'),
  ('users.manage',        'Invite users, change roles, deactivate users'),
  ('audit.read',          'Read audit logs'),
  ('clients.read',        'View client accounts'),
  ('clients.manage',      'Create clients and invite or deactivate portal users'),
  ('messages.read',       'Read client portal conversations'),
  ('messages.write',      'Reply to clients and manage conversations'),
  ('testimonials.moderate','Approve, publish, feature and add testimonials'),
  ('faqs.write',          'Edit FAQs'),
  ('links.write',         'Edit link-in-bio links')
on conflict (key) do update set description = excluded.description;

-- Role → permission matrix. Keep in sync with src/lib/permissions.ts
-- (tests/db/rls.test.ts verifies they match).
delete from public.role_permissions;
insert into public.role_permissions (role, permission_key)
select 'owner'::public.app_role, key from public.permissions
union all
select 'admin'::public.app_role, key from public.permissions
union all
select 'manager'::public.app_role, key from public.permissions
  where key in (
    'cms.read',
    'projects.write','projects.publish','projects.delete',
    'services.write','services.publish','services.delete',
    'team.write','team.publish','team.delete',
    'content.write','content.publish','content.delete',
    'sponsorship.write','sponsorship.publish','sponsorship.delete','sponsorship.rates',
    'inquiries.read','inquiries.write',
    'media.upload','media.update','media.delete',
    'audit.read',
    'clients.read','clients.manage','messages.read','messages.write','testimonials.moderate','faqs.write','links.write'
  )
union all
select 'editor'::public.app_role, key from public.permissions
  where key in (
    'cms.read','projects.write','services.write','team.write','content.write','sponsorship.write',
    'media.upload','media.update',
    'clients.read','messages.read','messages.write','faqs.write','links.write'
  )
union all
select 'viewer'::public.app_role, key from public.permissions
  where key in ('cms.read');

-- Site settings (only inserted when missing — admin edits are preserved).
insert into public.site_settings (key, value) values
  ('general', jsonb_build_object(
    'siteName', 'AI With Hamad',
    'tagline', 'AI engineering, automation and agentic systems',
    'description', 'AI With Hamad is an AI engineering and automation studio. We design and build n8n workflows, API integrations and agentic AI systems, and share what we learn through technical content.',
    'contactEmail', '',
    'phone', '',
    'whatsapp', '',
    'whatsappMessage', 'Hi AI With Hamad, I would like to talk about a project.',
    'address', '',
    'businessHours', '',
    'location', '',
    'logoMediaId', null
  )),
  ('home', jsonb_build_object(
    'heroEyebrow', 'AI engineering & automation studio',
    'heroTitle', 'We build AI systems that do real work.',
    'heroSubtitle', 'Workflow automation, API integrations and agentic AI — designed, engineered and operated with care.',
    'primaryCtaLabel', 'Start a project',
    'primaryCtaHref', '/contact',
    'secondaryCtaLabel', 'See our work',
    'secondaryCtaHref', '/projects',
    'positioningTitle', 'An engineering studio, not a prompt shop',
    'positioningBody', 'We treat AI as software: scoped problems, clear architecture, tested integrations and systems your team can operate.',
    'capabilities', jsonb_build_array(
      jsonb_build_object('title', 'Workflow automation', 'body', 'n8n pipelines with error handling, retries and observability.'),
      jsonb_build_object('title', 'Agentic systems', 'body', 'LLM agents with tools, guardrails and human-in-the-loop review.'),
      jsonb_build_object('title', 'Integrations', 'body', 'CRMs, payments, databases and internal APIs connected reliably.'),
      jsonb_build_object('title', 'Data & retrieval', 'body', 'Search and retrieval over your documents with evaluation built in.')
    ),
    'techStack', jsonb_build_array('n8n', 'Python', 'TypeScript', 'Next.js', 'Supabase', 'PostgreSQL', 'OpenAI API', 'Anthropic Claude', 'REST & webhooks', 'Vector search'),
    'process', jsonb_build_array(
      jsonb_build_object('title', 'Discover', 'body', 'Map the process, the data and what success means.'),
      jsonb_build_object('title', 'Design', 'body', 'Architecture, failure modes and a scoped plan.'),
      jsonb_build_object('title', 'Build', 'body', 'Iterative delivery with tests and review.'),
      jsonb_build_object('title', 'Operate', 'body', 'Monitoring, documentation and handover.')
    )
  )),
  ('about', jsonb_build_object(
    'title', 'About AI With Hamad',
    'intro', 'AI With Hamad is an AI engineering, automation and technology consulting studio that also publishes educational content about building with AI.',
    'body', 'We work with teams who want AI to do dependable, measurable work. Every engagement starts with the business process, not the model.',
    'values', jsonb_build_array(
      jsonb_build_object('title', 'Honest engineering', 'body', 'We state what AI can and cannot do, and measure results.'),
      jsonb_build_object('title', 'Ownership', 'body', 'You own the code, the workflows and the documentation.'),
      jsonb_build_object('title', 'Teach in public', 'body', 'We share practical lessons through our content.')
    )
  )),
  ('seo', jsonb_build_object(
    'defaultTitle', 'AI With Hamad — AI engineering & automation studio',
    'defaultDescription', 'AI engineering, workflow automation and agentic AI systems. Case studies, services, team and creator content from AI With Hamad.',
    'twitterHandle', '',
    'ogImageMediaId', null
  )),
  ('social', jsonb_build_object('links', jsonb_build_array())),
  ('sponsorship', jsonb_build_object(
    'intro', 'We partner with brands whose products genuinely help people build with AI.',
    'audienceSummary', '',
    'audience', jsonb_build_object('ageRanges', jsonb_build_array(), 'topCountries', jsonb_build_array(), 'genderSplit', jsonb_build_array(), 'asOf', null),
    'contentCategories', jsonb_build_array('AI tutorials', 'Automation walkthroughs', 'Tool reviews', 'Behind the build'),
    'formats', jsonb_build_array(
      jsonb_build_object('title', 'Dedicated video', 'body', 'A full video built around your product, with an honest walkthrough.'),
      jsonb_build_object('title', 'Integrated segment', 'body', 'A segment within a relevant tutorial or build video.'),
      jsonb_build_object('title', 'Short-form series', 'body', 'Short videos across TikTok, Reels and Shorts.'),
      jsonb_build_object('title', 'Technical collaboration', 'body', 'A real build or case study using your API or platform.')
    ),
    'whyPartner', jsonb_build_array(
      jsonb_build_object('title', 'Technical audience', 'body', 'Content aimed at builders, founders and operators.'),
      jsonb_build_object('title', 'Honest demos', 'body', 'We only show what we have actually built and tested.'),
      jsonb_build_object('title', 'Engineering depth', 'body', 'Integrations are built by the same team that builds client systems.')
    ),
    'ratesNotice', 'Partnership rates are available upon request.'
  )),
  ('contact', jsonb_build_object(
    'intro', 'Tell us about the process you want to automate or the system you want to build. We reply to every genuine inquiry.',
    'budgets', jsonb_build_array('Under $2,500', '$2,500 – $10,000', '$10,000 – $25,000', '$25,000+', 'Not sure yet'),
    'timelines', jsonb_build_array('As soon as possible', '1–3 months', '3–6 months', 'Exploring')
  )),
  ('internal.notifications', jsonb_build_object('inquiryRecipients', jsonb_build_array()))
on conflict (key) do nothing;

insert into public.navigation_items (location, label, href, sort_order)
select v.location::public.nav_location, v.label, v.href, v.sort_order
from (values
  ('header', 'Services',    '/services',    10),
  ('header', 'Projects',    '/projects',    20),
  ('header', 'Team',        '/team',        30),
  ('header', 'Content',     '/content',     40),
  ('header', 'Sponsorship', '/sponsorship', 50),
  ('header', 'About',       '/about',       60),
  ('footer', 'Services',    '/services',    10),
  ('footer', 'Projects',    '/projects',    20),
  ('footer', 'Team',        '/team',        30),
  ('footer', 'Content',     '/content',     40),
  ('footer', 'Testimonials', '/testimonials', 45),
  ('footer', 'Media kit',   '/media-kit',   50),
  ('footer', 'Contact',     '/contact',     60),
  ('legal',  'Privacy Policy', '/privacy-policy', 10),
  ('legal',  'Terms of Service', '/terms',        20),
  ('legal',  'Cookie Policy',  '/cookie-policy',  30)
) as v(location, label, href, sort_order)
where not exists (select 1 from public.navigation_items);

-- Link in bio in the header navigation (added in v2; only inserted when missing).
insert into public.navigation_items (location, label, href, sort_order)
select 'header'::public.nav_location, 'Links', '/links', 70
where not exists (select 1 from public.navigation_items where location = 'header' and href = '/links');

insert into public.legal_documents (slug, title, body, effective_on) values
  ('privacy-policy', 'Privacy Policy', $md$
This policy explains what personal information AI With Hamad ("we", "us") collects through this website, why, and what choices you have. **Please review and adapt this text with qualified legal advice for your jurisdiction before relying on it.**

## Information we collect

- **Information you send us.** When you use the contact or sponsorship forms we collect the details you enter: name, email address, and optionally company, phone number, website, budget, timeline and your message.
- **Technical information.** To protect the forms from abuse we store a one-way hash of your IP address and your browser's user-agent string with your submission.
- **Analytics.** We use privacy-friendly, cookie-less analytics (Vercel Web Analytics and Speed Insights) to understand aggregate page views and site performance.

## How we use information

- To respond to your inquiry and, if we work together, to manage that relationship.
- To protect the website from spam and abuse.
- To understand and improve the website's content and performance.

We do not sell your personal information.

## Service providers

We use service providers to operate the website, including Vercel (hosting and analytics), Supabase (database and file storage) and, where configured, an email delivery provider. They process data on our behalf.

## Retention

We keep inquiries for as long as needed to respond and manage any resulting relationship, and delete or archive them when no longer needed.

## Your choices

You can ask us to access, correct or delete the personal information you sent us by contacting us through the contact page.

## Changes

We will update this page when our practices change and revise the date shown on this page.
$md$, current_date),
  ('terms', 'Terms of Service', $md$
These terms govern your use of this website. **Please review and adapt this text with qualified legal advice before relying on it.**

## Use of the website

You may browse the website and contact us for legitimate purposes. You must not attempt to disrupt the website, access areas you are not authorized to access, or submit spam or unlawful content.

## Content

Case studies, articles and media on this website are provided for information. Unless stated otherwise, the content is owned by AI With Hamad or used with permission. Third-party names and trademarks belong to their owners.

## No professional advice

Information on this website is general and is not a substitute for advice tailored to your situation. Any engagement is governed by a separate written agreement.

## Third-party links and embeds

The website links to and embeds content from third-party platforms (for example YouTube or LinkedIn). Those platforms have their own terms and privacy policies.

## Liability

The website is provided "as is". To the extent permitted by law we are not liable for losses arising from its use.

## Changes

We may update these terms; the date on this page shows the latest revision.
$md$, current_date),
  ('cookie-policy', 'Cookie Policy', $md$
This page explains how this website uses cookies and similar technologies.

## Cookies we use

- **Strictly necessary (staff only).** Signing in to the admin area sets authentication cookies. Visitors who do not sign in do not receive these cookies.
- **Analytics.** Our analytics (Vercel Web Analytics) is designed to work without cookies.

## Embedded content

Videos and posts from YouTube, Vimeo, TikTok, Instagram, Facebook or LinkedIn are only loaded when you choose to play or open them. Once loaded, those providers may set their own cookies under their own policies. YouTube videos use the privacy-enhanced `youtube-nocookie.com` domain.

## Managing cookies

You can block or delete cookies in your browser settings. Blocking strictly necessary cookies will prevent staff sign-in.

## Changes

We will update this page if our use of cookies changes.
$md$, current_date)
on conflict (slug) do nothing;

-- Starter services carried over from the original website (editable/removable in Admin).
insert into public.services (slug, title, summary, description, icon, is_published, published_at, is_featured, sort_order)
select v.slug, v.title, v.summary, v.description, v.icon, true, now(), true, v.sort_order
from (values
  ('workflow-automation', 'n8n Workflow Automation',
   'End-to-end workflow design in n8n — from lead capture and CRM syncs to invoicing and reporting.',
   'We design, build and document n8n workflows that remove repetitive work. Every workflow includes error handling, retries and alerting so it can be trusted in production, and can be self-hosted or run on n8n Cloud.',
   'workflow', 10),
  ('api-integrations', 'Custom API Integrations',
   'Connecting the tools your business already runs on — CRMs, payment platforms, databases and internal systems.',
   'We connect the systems you already use into reliable, observable data pipelines: authenticated API clients, webhooks, data mapping and reconciliation, with clear ownership of failure cases.',
   'plug', 20),
  ('agentic-ai-systems', 'Agentic AI Systems',
   'AI agents that research, triage, draft and decide — orchestrated to run real business processes.',
   'We build LLM-powered agents with well-defined tools, guardrails, evaluation and human-in-the-loop review, integrated with your workflows so they do dependable work rather than demos.',
   'bot', 30)
) as v(slug, title, summary, description, icon, sort_order)
where not exists (select 1 from public.services where deleted_at is null);

insert into public.service_features (service_id, title, description, sort_order)
select s.id, f.title, f.description, f.sort_order
from public.services s
join (values
  ('workflow-automation', 'Process mapping', 'We document the current process and agree what to automate first.', 10),
  ('workflow-automation', 'Production-grade workflows', 'Error handling, retries, idempotency and alerting built in.', 20),
  ('workflow-automation', 'Handover', 'Documentation and training so your team can operate and extend it.', 30),
  ('api-integrations', 'API clients & webhooks', 'Authenticated, rate-limit-aware integrations with retries.', 10),
  ('api-integrations', 'Data mapping', 'Clear transformations between systems with validation.', 20),
  ('api-integrations', 'Monitoring', 'Visibility into failures and reconciliation reports.', 30),
  ('agentic-ai-systems', 'Tool-using agents', 'Agents with scoped tools and permissions.', 10),
  ('agentic-ai-systems', 'Evaluation', 'Test sets and metrics to measure agent quality before launch.', 20),
  ('agentic-ai-systems', 'Human in the loop', 'Review steps where decisions carry risk.', 30)
) as f(slug, title, description, sort_order) on f.slug = s.slug
where not exists (select 1 from public.service_features sf where sf.service_id = s.id);

-- Founders (names locked; everything else editable in Admin → Team).
insert into public.team_members (slug, name, role_title, is_published, published_at, is_featured, is_locked, sort_order)
select v.slug, v.name, v.role_title, true, now(), true, true, v.sort_order
from (values
  ('hammadullah', 'Hammadullah', 'Co-founder · AI Engineer', 10),
  ('maaz-ali',    'Maaz Ali',    'Co-founder · AI Engineer', 20)
) as v(slug, name, role_title, sort_order)
where not exists (select 1 from public.team_members m where m.slug = v.slug and m.deleted_at is null);

insert into public.faqs (question, answer, sort_order)
select v.q, v.a, v.o
from (values
  ('How do we start working together?', 'Send us a message through the contact form or WhatsApp. We reply to schedule a short discovery call about your process and goals.', 10),
  ('Do you only build with n8n?', 'No. We choose tools per project — workflow platforms, custom code, APIs and LLM providers — based on reliability and what your team can operate.', 20),
  ('Who owns the work?', 'You do. Workflows, code and documentation are handed over at the end of the engagement.', 30),
  ('How do we communicate during a project?', 'Day-to-day communication happens on WhatsApp. Clients also get a private portal to message the team and share feedback.', 40)
) as v(q, a, o)
where not exists (select 1 from public.faqs);

commit;
