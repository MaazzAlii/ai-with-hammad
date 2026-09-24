# CLAUDE.md — AI With Hamad platform

Primary instructions for Claude Code (and any coding agent) working in this repository.
Read this file fully before changing code. Project skills in `.claude/skills/` hold step-by-step
procedures; `docs/` holds architecture, setup and the task system.

## 1. Purpose

AI With Hamad is an AI engineering, automation and content-creator agency. This repository is its
production platform: a public agency website (services, case studies, team, creator content,
sponsorship + media kit, contact) and an internal, invite-only CMS/CRM that edits all of it.

**Honesty rule:** the site must never show fabricated statistics, clients, logos, testimonials,
revenue, audience numbers or team members. Everything public comes from CMS data entered by staff,
and every section hides itself when its data is empty.

## 2. Stack

Next.js 16 (App Router, Turbopack, `proxy.ts`) · React 19 · TypeScript (strict) · Tailwind CSS v4 ·
shadcn/ui-style components on `radix-ui` · Lucide · Supabase (Postgres, Auth, Storage) ·
Drizzle ORM · Zod 4 · React Hook Form (public forms) · Vercel (+ Analytics, Speed Insights) ·
Resend (optional email) · Vitest · Playwright.

Next.js 16 differs from older versions: **read `node_modules/next/dist/docs/` before using an API
you are unsure about** (async `params`/`searchParams`/`cookies()`, `proxy.ts` not `middleware.ts`,
`revalidateTag(tag, profile)`, `PageProps<'/route'>` helpers).

## 3. Architecture (see `docs/PLAN.md`)

```
src/app/(site)/**        public pages (Server Components, ISR revalidate=3600)
src/app/admin/**         CMS (dynamic, noindex, requireStaff in layout)
src/app/login, auth/**   staff sign-in, invite/recovery confirm, set password, sign out
src/proxy.ts             session refresh + fast redirect for /admin (NOT the security boundary)
src/server/dal/public    published-only queries → DTOs (never select internal columns/tables)
src/server/dal/admin     CMS queries (call only after authorization)
src/server/actions       server actions: runAction → authorize → zod → Drizzle → audit → revalidate
src/server/auth          getCurrentStaff / authorize / requireStaff / requirePagePermission
src/lib                  env, validation (zod), permissions, media rules, embeds, markdown, seo, jsonld
src/db                   Drizzle schema (mirror of the SQL), client
supabase/AI_WITH_HAMAD_SETUP.sql   canonical DB: tables, RLS, triggers, storage, seed
scripts/local            local test stack (Postgres + real GoTrue + storage emulator)
```

## 4. Coding conventions

- TypeScript strict; no `any` except the documented table registry in `cms-common.ts`.
- Server Components by default. Add `"use client"` only for interactivity (forms, dialogs, dnd, uploads).
- Functions can't be passed from Server to Client Components — pass pre-rendered nodes or server actions.
- Every server-only module imports `"server-only"`. Never import `@/db`, `@/server/*` or `@/lib/supabase/admin` from client code.
- Import order: external, then `@/…`, then relative. Keep files focused; match surrounding style.
- Use `cn()` for class merging, tokens from `globals.css` (never hard-coded hex colours in components).
- User-facing copy: specific, factual, no hype.

## 5. Design system (see `docs/DESIGN_SYSTEM.md`)

Dark theme, cyan `--color-accent` / teal `--color-accent-2`, fonts Sora (display) / Manrope (body) /
JetBrains Mono (labels) self-hosted via `next/font/local`. Radius tokens: `rounded-control` (inputs),
`rounded-button`, `rounded-card`, `rounded-media` (all images/video). Use `MediaImage` for public
images (aspect-ratio locked, `next/image`). Respect `prefers-reduced-motion`. Tap targets ≥ 40px.

## 6. Database rules

- `supabase/AI_WITH_HAMAD_SETUP.sql` is canonical and **idempotent**. Any schema change updates it
  **and** `src/db/schema.ts`; `npm run test:db` (schema-consistency test) must pass.
- UUID PKs, `created_at`/`updated_at` (trigger), soft delete (`deleted_at`) for content entities,
  partial unique slug indexes `where deleted_at is null`, indexes on every FK.
- Binary media never goes in Postgres — only metadata in `media_assets`.
- Internal/confidential data lives in **separate tables** (e.g. `sponsorship_package_rates`), never in
  columns of publicly readable tables (RLS is row-level only).
- No secrets, passwords or keys in SQL or seed data.

## 7. Authentication & authorization

- Supabase Auth, invite-only. No signup UI. New auth users get an **inactive `viewer`** profile via trigger.
- Identity: `supabase.auth.getUser()` on the server (never trust `getSession()` server-side).
- Role/permissions: **always from the database** (`profiles.role` → `role_permissions`). Never from the
  client, hidden inputs, JWT user metadata or query strings.
- Every admin page: `requirePagePermission(...)`. Every server action: `runAction(async () => { const staff = await authorize("x.y"); ... })`.
- Validate every id that arrives as a bound action argument with `assertId()` (bound args are client-controlled).
- Publishing flags (`isPublished`, `isFeatured`, `isPinned`, highlight flags, ordering) require `*.publish`;
  editors' saves must ignore them server-side.
- Owners: only owners grant/modify `owner`; the DB trigger blocks demoting/deactivating the last owner.
- RLS mirrors the same matrix via `private.has_permission()` for the public Data API.
- Two account kinds in `profiles.kind`: `staff` (admin panel) and `client` (portal, linked to `clients` via
  `profiles.client_id`). `getCurrentStaff`/`has_permission` only accept `kind='staff'`. Portal pages use
  `requireClient()`, portal actions `authorizeClient()`, and every portal query filters by the caller's `client_id`.
- The founders (Hammadullah, Maaz Ali) are `team_members.is_locked`: a DB trigger blocks renaming, re-slugging,
  unlocking and deleting them. Everything else a visitor sees must stay editable from Admin (no hard-coded copy).
- Only async functions may be exported from `"use server"` files (every export is a public endpoint;
  guarded by `tests/unit/server-actions-guard.test.ts`). Put read helpers in the DAL.

## 8. Storage rules

- Browser uploads directly to Supabase Storage with the user's session (≤ 6 MB standard, larger via TUS).
- `prepareUpload` (authorize + validate + server-generated path) → upload → `finalizeUpload` (verifies the
  `storage.objects` row size/MIME, then records `media_assets`). Never trust client metadata alone.
- Buckets have MIME allow-lists + size limits in SQL; mirror them in `src/lib/media/buckets.ts`.
- SVG only in `site-assets` (requires `settings.write`) and rendered via `<img>`/unoptimized only.
- Deleting media: check `mediaUsage()` first; delete via the secret-key client after authorization.
- `private-documents` is private: signed URLs only.

## 9. Security rules

- Validate all input with zod on the server (client validation is UX only).
- No `dangerouslySetInnerHTML` except `JsonLd` (escaped serializer) and `Markdown` (escaping renderer).
- URLs: `safeHttpUrl` / `safeHref` / `safeNextPath`; embeds only via `parseEmbed` allow-list — never store iframe HTML.
- Public forms and logins: captcha (`verifyCaptcha`, built-in or Turnstile) + honeypot + min fill time + DB rate limit + storage-first; errors never reveal internals.
- `runAction` hides unexpected errors; never return stack traces or DB messages to users.
- Audit every mutation (`audit()`), never log secrets (metadata is scrubbed; don't bypass it).
- Secrets only in server env; `NEXT_PUBLIC_*` must never contain secrets.

## 10. SEO rules

- Every public page: `generateMetadata` via `buildMetadata()` (unique title/description, canonical, OG).
- JSON-LD only for content visible on the page (`src/lib/jsonld.ts`). No fake reviews/ratings.
- Drafts must 404; filtered list views are `noindex, follow`; admin/login are `noindex` + disallowed in robots.
- Sitemap lists only published canonical URLs. `NEXT_PUBLIC_ALLOW_INDEXING=true` only on production.
- Never promise rankings; no keyword stuffing; no mass-generated pages.

## 11. Performance rules

- Server Components + ISR; `revalidatePublicSite()` after every CMS mutation.
- `next/image` with `sizes`; `priority` only for the LCP image; aspect-ratio containers (no CLS).
- Video: click-to-load facades (`VideoEmbed`), `preload="none"` (`VideoPlayer`). Never autoload iframes.
- Admin-only libraries (dnd-kit, tus-js-client) must not be imported by public components.
- Select only needed columns; batch child queries (no N+1).
- Drizzle correlated subqueries: use fully qualified raw names (`sql\`message_threads.id\``) — `${table.id}` renders
  unqualified and binds to the inner table.
- No `loading.tsx` above routes that call `notFound()` (streams a 200 = soft 404). Use `NavigationLoader`.

## 12. Testing rules

- `npm run lint && npm run typecheck && npm test` before every commit; `npm run build` before pushing app changes.
- Unit tests (`tests/unit`) for pure logic; DB tests (`tests/db`) for SQL/RLS/storage policies against a fresh
  database built from the setup SQL; E2E (`tests/e2e`) for user flows and role restrictions on the local stack.
- New permission-gated feature ⇒ add a role test. New public route ⇒ add it to `public.spec.ts`/`seo.spec.ts`.
- See `docs/TESTING.md` for running the local stack.

## 13. Git rules

- Conventional commits (`feat:`, `fix:`, `test:`, `docs:`, `security:`, `perf:`, `chore:`).
- The owner prefers **one commit per file**. Never commit `.env*` (except `.env.example`), `.tmp/`, build output.
- Work on the designated feature branch; open PRs to `main`; don't force-push shared branches.

## 14. Deployment rules

- Vercel + Supabase now; Docker on a VPS later (`docs/HOSTING_PLAN.md`). Env vars documented in `.env.example` and `docs/VERCEL_DEPLOYMENT.md`.
- Canonical URLs come from `NEXT_PUBLIC_SITE_URL` — never hard-code the Vercel or custom domain.
- Run the SQL setup on the Supabase project before first deploy (`docs/SUPABASE_SETUP.md`).

## 15. Forbidden

- Fabricated data of any kind on the public site; placeholder "stats".
- Scraping social platforms or faking API integrations (manual entry or official APIs only).
- Exposing `sponsorship_package_rates` (or any internal field) through public code, APIs or HTML.
- Trusting client-supplied roles/permissions/ids; skipping `authorize()` in an action.
- Storing binary files in Postgres; storing raw embed HTML.
- Service/secret keys in client code or `NEXT_PUBLIC_*`.
- Disabling RLS, tests or lint rules to make something pass.
- Editing the canonical SQL without keeping it idempotent and in sync with Drizzle.
