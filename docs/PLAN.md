# AI With Hamad — Engineering Plan

This plan turns the research in [`RESEARCH.md`](./RESEARCH.md) into an architecture and an ordered task list.
Each task lives in [`docs/tasks/`](./tasks) with objective, dependencies, acceptance criteria and status.

## 1. Product scope

One Next.js application serving two audiences:

| Surface | Audience | Rendering |
| --- | --- | --- |
| Public site (`/`, `/about`, `/services`, `/projects`, `/team`, `/content`, `/sponsorship`, `/media-kit`, `/contact`, legal pages) | Prospects, brands, recruiters, search engines | Server Components, ISR (`revalidate = 3600`) + on-demand revalidation after CMS edits |
| Admin CMS (`/admin/**`) + `/login` | Internal staff (invite-only) | Dynamic, per-request, `noindex` |

## 2. Architecture

```
Browser ──► Vercel (Next.js 16)
             ├─ src/proxy.ts ............ refresh Supabase session cookies; gate /admin (fast path)
             ├─ app/(site)/** ........... RSC pages → src/server/dal/public/* (DTOs, published-only)
             ├─ app/admin/** ............ RSC pages → src/server/dal/admin/* (requirePermission)
             ├─ Server Actions .......... zod-validate → requirePermission → Drizzle → audit log → revalidatePath
             └─ Route handlers .......... sitemap.xml, robots.txt, OG images, /auth/callback
                      │                                   │
                      ▼ (Drizzle, server-only)            ▼ (@supabase/ssr, user JWT)
             Supabase Postgres  ◄──────────────  Supabase Auth / Supabase Storage
             (RLS on every table)                 (bucket MIME+size limits, storage.objects RLS)
```

Key rules:

- **All application reads/writes go through Drizzle on the server** (`src/db`, `import 'server-only'`). The DB connection
  bypasses RLS, therefore the data-access layer is the enforcement point and is covered by tests.
- **RLS is defense-in-depth** for the public Supabase Data API (the publishable key is public). Anonymous users can read only published
  rows of public tables. Sensitive tables (inquiries, rates, audit logs, profiles, rate limits) have no anon policy.
- **Uploads** go browser → Supabase Storage with the user's JWT (storage RLS requires `media.upload`), then a server action
  `finalizeUpload` verifies the object in `storage.objects` (size, MIME, bucket, path) and records `media_assets`.
- **Authorization** = role in `profiles.role` → permissions in `role_permissions`. Checked by `requirePermission()` in every
  admin page/action, and by `private.has_permission()` in RLS.

### Directory layout

```
src/
  app/
    (site)/            public pages + layout (header/footer)
    admin/             CMS (layout with sidebar; each module: list/new/[id])
    login/             staff sign-in (no signup)
    auth/              callback + sign-out route
    api/               (none public except health)
    sitemap.ts robots.ts opengraph-image.tsx manifest.ts
  components/
    ui/                shadcn-style primitives
    site/              public sections (hero, project-card, media gallery, video facade…)
    admin/             CMS widgets (data table, media picker, sortable list, forms)
  db/                  schema.ts, index.ts, relations
  lib/                 env, utils, seo, url-safety, embeds, markdown, rate-limit, validation (zod)
  server/
    auth/              session, requireStaff, requirePermission, rbac
    dal/public/        published-only queries → DTOs
    dal/admin/         CMS queries
    actions/           server actions per module
    email/             provider interface + resend + console
    audit.ts, storage.ts, revalidate.ts
supabase/AI_WITH_HAMAD_SETUP.sql   canonical, idempotent DB setup (tables, RLS, storage, seed)
drizzle/                           drizzle-kit baseline snapshot (future incremental migrations)
scripts/local/                     local Postgres + GoTrue + storage gateway for tests
tests/unit, tests/db, tests/e2e
```

## 3. Data model (summary)

Enums: `app_role`, `inquiry_status`, `inquiry_priority`, `content_platform`, `media_kind`, `project_media_type`, `tag_kind`, `nav_location`.

| Domain | Tables |
| --- | --- |
| Identity & access | `roles`, `permissions`, `role_permissions`, `profiles` |
| Media | `media_assets` |
| Services | `services`, `service_features` |
| Projects | `projects`, `project_media`, `project_metrics`, `project_tags`, `project_features`, `project_team_members` |
| Team | `team_members`, `team_social_links` |
| Content | `social_platforms`, `content_items`, `content_metrics` |
| Sponsorship | `sponsorship_partners`, `sponsorship_packages`, `sponsorship_package_rates` (**admin-only**), `sponsorship_inquiries` |
| CRM | `contact_inquiries`, `inquiry_notes` |
| Site | `site_settings`, `navigation_items`, `legal_documents` |
| Ops | `audit_logs`, `rate_limits` |

Conventions: UUID PKs, `created_at`/`updated_at` (trigger), `deleted_at` soft delete on content entities, `slug` unique among
non-deleted rows, `is_published` + `published_at`, `is_featured`, `sort_order`, FKs with explicit `on delete` behaviour,
indexes on every FK and on `(is_published, sort_order)`.

## 4. RBAC matrix

| Permission | owner | admin | manager | editor | viewer |
| --- | :-: | :-: | :-: | :-: | :-: |
| `cms.read` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `projects/services/team/content/sponsorship.write` | ✓ | ✓ | ✓ | ✓ | |
| `*.publish` (publish, feature, pin, reorder) | ✓ | ✓ | ✓ | | |
| `*.delete` | ✓ | ✓ | ✓ | | |
| `sponsorship.rates` (read/write internal rates) | ✓ | ✓ | ✓ | | |
| `inquiries.read` / `inquiries.write` | ✓ | ✓ | ✓ | | |
| `inquiries.delete` | ✓ | ✓ | | | |
| `media.upload` / `media.update` | ✓ | ✓ | ✓ | ✓ | |
| `media.delete` | ✓ | ✓ | ✓ | | |
| `settings.write` / `navigation.write` / `legal.write` | ✓ | ✓ | | | |
| `users.read` | ✓ | ✓ | | | |
| `users.manage` (invite, role change, deactivate) | ✓ | ✓¹ | | | |
| `audit.read` | ✓ | ✓ | ✓ | | |

¹ Admins cannot grant/revoke the `owner` role or modify an owner; the last active owner can never be demoted/deactivated.

## 5. Phases and task index

| Phase | Tasks |
| --- | --- |
| A. Foundation & planning | 001–008 |
| B. Data & security core | 009–016 |
| C. Public site | 017–037 |
| D. Media & video | 038–043 |
| E. Admin CMS | 044–060 |
| F. SEO | 061–067 |
| G. Quality (a11y, perf, security, email, analytics) | 068–077 |
| H. Testing | 078–085 |
| I. Release | 086–094 |

See `docs/tasks/` for the full list; statuses are kept current there and summarised in `docs/FINAL_REPORT.md`.

## 6. Definition of done (per task)

A task is `COMPLETED` only when its acceptance criteria were verified by the listed verification (tests, build, manual
inspection with Playwright screenshots, SQL checks). Tasks that depend on owner-only actions (creating the Supabase project,
Vercel project, DNS) are marked `BLOCKED` with the exact blocker and the documented steps.

## 7. Risks & mitigations

| Risk | Mitigation |
| --- | --- |
| Drizzle schema and SQL drift | `tests/db/schema-consistency.test.ts` compares every Drizzle table/column/nullability with the DB built from the SQL file |
| Sensitive data exposed via Supabase Data API | Isolated tables, no anon policies, `tests/db/rls.test.ts` runs queries as `anon`/`authenticated` |
| Server action called directly with forged input | zod on server + `requirePermission` in every action + E2E role tests |
| Build requires DB | DAL returns empty results only when `DATABASE_URL` is absent (CI); production requires it (env validation) |
| Large video uploads on serverless | Direct-to-Storage upload (TUS > 6 MB); server never proxies file bytes |
| No local Supabase (Docker blocked) | Real GoTrue built from source + storage emulator enforcing real `storage.objects` RLS |
