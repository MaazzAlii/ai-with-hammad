# Research Notes

_Date: 2026-09-24._

**Method and limitations.** Official documentation sites (nextjs.org, supabase.com,
developers.google.com, orm.drizzle.team, ui.shadcn.com, vercel.com) are blocked by this session's
egress policy, so pages could not be fetched directly. Sources used instead:

1. **Version-matched Next.js 16.3 documentation bundled in `node_modules/next/dist/docs/`.** This is the
   official documentation, shipped with the installed version, and is the primary source for framework decisions.
2. Package source and type definitions of the installed versions (`@supabase/ssr@0.12`, `@supabase/supabase-js@2.117`,
   `@supabase/storage-js`, `drizzle-orm@0.45`, `zod@4`), read directly from `node_modules`.
3. Web search result summaries of official pages (Supabase docs, Google Search Central). URLs are listed per section.
4. Supabase Auth (GoTrue) **source code** (`github.com/supabase/auth`, retrieved via the Go module proxy), including its SQL migrations.

Every finding below is tagged with its source and with what it changed in the architecture.

---

## 1. Next.js 16 (App Router)

Source: `node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md`, `caching-without-cache-components.md`,
`data-security.md`, `03-api-reference/03-file-conventions/proxy.md`, `01-metadata/*`.

| Finding | Architecture implication |
| --- | --- |
| `middleware.ts` is **deprecated and renamed to `proxy.ts`** (export `proxy`). Proxy runs on the Node.js runtime only. | Session refresh + `/admin` gate lives in `src/proxy.ts`. |
| **Async Request APIs are mandatory**: `params`, `searchParams`, `cookies()`, `headers()` are Promises. Global `PageProps<'/route/[slug]'>` helpers exist. | All dynamic pages `await props.params`. |
| `revalidateTag(tag, profile)` now **requires a second argument**; `updateTag()` gives read-your-writes inside Server Actions; `refresh()` refreshes the client router. | CMS mutations call `revalidatePath('/', 'layout')` (small site → invalidate all public pages) — simple and correct. |
| `cacheComponents` (PPR / `use cache`) is opt-in. `unstable_cache` still works but is superseded. | We **do not** enable `cacheComponents` (keeps the model simple and predictable). Public pages use ISR via `export const revalidate` + on-demand `revalidatePath`. Admin pages are dynamic (they read cookies). |
| Turbopack is the default for `dev` and `build`. | No custom webpack config. |
| `next/image`: `minimumCacheTTL` default is now 4h; local images with query strings need `localPatterns`; remote hosts need `images.remotePatterns`. | Supabase Storage host is derived from `NEXT_PUBLIC_SUPABASE_URL` and added to `remotePatterns`. |
| Metadata API: `generateMetadata`, `metadataBase`, `alternates.canonical`, file conventions `sitemap.ts`, `robots.ts`, `opengraph-image.tsx` (`ImageResponse`). | Central `buildMetadata()` helper; dynamic OG image; DB-driven sitemap. |
| Data security guide: use a **Data Access Layer** marked `server-only`, return DTOs (not raw rows), re-verify auth inside every Server Action (actions are public HTTP endpoints). | `src/server/dal/public/*` returns minimal DTOs; every admin action calls `requirePermission()` first. |
| React 19.2: `useActionState`, `useFormStatus`, View Transitions. | Forms use Server Actions with React Hook Form for client validation. |

## 2. Supabase (Auth, Postgres, RLS, Storage)

Sources (search summaries of official docs):
[Server-side auth for Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs),
[Creating an SSR client](https://supabase.com/docs/guides/auth/server-side/creating-a-client),
[RLS](https://supabase.com/docs/guides/database/postgres/row-level-security),
[RLS performance & best practices](https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv),
[Standard uploads](https://supabase.com/docs/guides/storage/uploads/standard-uploads),
[Resumable uploads](https://supabase.com/docs/guides/storage/uploads/resumable-uploads),
[Upload file size restrictions](https://supabase.com/docs/guides/troubleshooting/upload-file-size-restrictions-Y4wQLT);
plus `@supabase/ssr` README/design doc and GoTrue source.

| Finding | Implication |
| --- | --- |
| `@supabase/ssr` provides `createBrowserClient` / `createServerClient`; cookies must use `getAll`/`setAll` (individual get/set/remove are going away). `setAll` also receives cache headers. | Implemented exactly that way in `src/lib/supabase/*`. |
| **Never trust `getSession()` on the server** — it reads the cookie without verification. `getClaims()` verifies the JWT signature (via JWKS for asymmetric keys; falls back to the Auth server for symmetric keys); `getUser()` always asks the Auth server. | Server-side identity: `getClaims()` in proxy (cheap), `getUser()` in `requireStaff()` (authoritative; also catches revoked sessions). Role is **always** loaded from the `profiles` table, never from the browser or user metadata. |
| Proxy should refresh the session once per navigation to avoid refresh-token races. | `src/proxy.ts` refreshes on `/admin/**` and `/login`. |
| RLS: wrap `auth.uid()` in `(select auth.uid())` so it's evaluated once (initPlan); always scope policies with `TO authenticated`/`TO anon`; index columns used by policies. | All policies follow this; permission checks go through `private.has_permission()`. |
| Security-definer helper functions: set `search_path = ''`, fully qualify names, keep them in a **schema not exposed by the API**. | Helpers live in schema `private` (not exposed to PostgREST); `EXECUTE` revoked from `public`/`anon`. |
| RLS is **row-level only**; a policy that lets anon read a row exposes every column of it via the Data API. | Internal sponsorship rates live in a **separate table** (`sponsorship_package_rates`) with no anon policy at all — not in columns of the public `sponsorship_packages` table. Same for inquiries. |
| New projects use publishable (`sb_publishable_…`) / secret (`sb_secret_…`) keys; legacy anon/service_role JWT keys still work. | Env supports both names (`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` → fallback `NEXT_PUBLIC_SUPABASE_ANON_KEY`; `SUPABASE_SECRET_KEY` → fallback `SUPABASE_SERVICE_ROLE_KEY`). |
| Standard uploads are recommended up to **6 MB**; above that use **TUS resumable uploads** (chunk size must be 6 MB), up to the plan's global limit. | Media uploader uses standard upload ≤ 6 MB and `tus-js-client` above. |
| Buckets support `file_size_limit` and `allowed_mime_types`, enforced server-side by Storage before accepting the object; the global project limit always wins. | Every bucket is created with an explicit MIME allow-list and size limit in the SQL setup — the **server-side** half of upload validation. |
| Storage access control is RLS on `storage.objects`: upload needs `INSERT`; upsert additionally `SELECT`+`UPDATE`; delete needs `DELETE`; public buckets serve reads without policies; helpers `storage.foldername()`, `storage.extension()`. | Policies grant INSERT/UPDATE/DELETE only to staff with `media.*` permissions; no anon SELECT policy (public buckets still serve files, but can't be **listed**). |
| Supabase Auth has a "disable signups" setting; users can be invited by the service role (`auth.admin.inviteUserByEmail`). | No public signup page. Admin → Users invites staff (server-only secret key). A DB trigger creates an **inactive** `viewer` profile for any auth user, so an accidental signup gets zero CMS access. |
| Supavisor transaction pooler (port 6543) doesn't support prepared statements. | `postgres(url, { prepare: false })` in `src/db/index.ts`. |

## 3. PostgreSQL & Drizzle ORM

Sources: `drizzle-orm` 0.45 type definitions, `drizzle-kit` 0.31 CLI help; PostgreSQL 16 docs knowledge (verified by running SQL on a local PG 16).

- `pgTable` + `pgEnum`, `uuid().defaultRandom()`, `timestamp({ withTimezone: true })`, `.$onUpdate()`, relations via `relations()`;
  `getTableConfig()` lets a test introspect Drizzle definitions → used for the **schema consistency test** that compares Drizzle
  tables/columns with the live database created by the SQL setup script.
- drizzle-kit `schemaFilter: ['public']` keeps it away from Supabase-managed `auth`/`storage` schemas.
- Idempotent DDL: `create table if not exists`, `do $$ begin create type … exception when duplicate_object then null; end $$`,
  `drop policy if exists … ; create policy …`, `create or replace function`, `insert … on conflict do update/nothing`.
- `updated_at` via a single `set_updated_at()` trigger function.
- Partial unique indexes (`where deleted_at is null`) for slugs with soft delete; `pg_trgm` not required at this scale — `ilike` search on indexed columns is sufficient for an internal CMS.

## 4. Tailwind CSS v4 + shadcn/ui

Sources: installed `tailwindcss@4.3` / `@tailwindcss/postcss`, create-next-app output; shadcn/ui conventions (radix-ui primitives, `cva` variants, `cn()` = `clsx` + `tailwind-merge`).

- Tailwind v4 is CSS-first: `@import "tailwindcss"`, tokens in `@theme`, no `tailwind.config.js` required.
- shadcn/ui components are copied source (not a dependency), built on the unified `radix-ui` package. Registry is blocked here, so
  the needed components (Button, Input, Textarea, Label, Select, Dialog, DropdownMenu, Tabs, Switch, Badge, Card, Table, Sheet, Tooltip)
  are written by hand following the same API; `components.json` is committed for future CLI use.

## 5. Google Search Essentials & technical SEO

Sources: [SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide),
[General structured data guidelines](https://developers.google.com/search/docs/appearance/structured-data/sd-policies),
[Intro to structured data](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data).

- People-first, original content; no keyword stuffing; no mass-generated thin pages → we do **not** generate location/keyword landing pages.
- Unique, descriptive `<title>` and meta description per page; descriptive URLs (`/projects/<slug>`); crawlable `<a href>` links (Next `<Link>` renders real anchors).
- One canonical URL per page (`alternates.canonical`), absolute URLs built from `NEXT_PUBLIC_SITE_URL`.
- **Structured data must describe content visible on the page** and be complete; violations can remove rich-result eligibility or be treated as spam →
  JSON-LD is generated from the same DTO used to render the page (e.g. `VideoObject` only when a video is actually embedded; no `Review`/`AggregateRating` because we don't show reviews).
- Sitemaps list only canonical, indexable URLs; `robots.txt` should not be used to hide pages from the index — use `noindex`. → Drafts are never
  rendered publicly (404) and admin pages carry `noindex` **and** are disallowed in robots.
- Images: descriptive `alt`, responsive sizes, modern formats (`next/image` → AVIF/WebP).
- Google does not use meta keywords; we don't emit them.
- No ranking promises are made anywhere in the product or docs.

## 6. Accessibility (WCAG 2.2 AA)

- Colour contrast ≥ 4.5:1 for body text (tokens checked: `--muted` on `--bg` ≈ 7.3:1).
- Visible focus (`:focus-visible` ring), skip link, landmarks (`header`/`nav`/`main`/`footer`), one `h1` per page, logical heading order.
- Target size ≥ 24×24 CSS px (WCAG 2.5.8) — buttons are ≥ 40 px tall.
- Forms: associated `<label>`, `aria-invalid` + `aria-describedby` for errors, errors announced via `role="alert"`.
- Respect `prefers-reduced-motion`; no auto-playing video with sound; video has title/caption.
- Radix primitives provide dialog focus-trapping and keyboard support.

## 7. Performance (Core Web Vitals: LCP, CLS, INP)

- Server Components by default; client components only for interactivity (nav toggle, forms, media uploader, drag-and-drop, lightbox).
- `next/font` self-hosts fonts (no render-blocking Google CSS), `display: swap`, subset `latin`.
- `next/image` with explicit `sizes`, `priority` only for the LCP hero image; fixed aspect-ratio containers prevent CLS.
- Video: **click-to-load facade** for YouTube/Vimeo (poster + play button, iframe injected on click, `youtube-nocookie.com`);
  self-hosted video uses `preload="none"` + poster. Nothing video-related loads on initial page load.
- ISR for public pages; DB queries select only needed columns; indexes on `(is_published, sort_order)`, slugs, FKs.
- Heavy admin-only libraries (dnd-kit, tus) never enter public bundles (route-level code splitting + `dynamic()`).

## 8. Security

- Server Actions are reachable by direct POST → every action re-authenticates and re-authorizes (no trust in hidden inputs or client role).
  Next.js Server Actions compare `Origin` with `Host` (CSRF mitigation for POST); we additionally use `SameSite=Lax` auth cookies.
- Input validation with **Zod** on the server for every action/route; the same schema drives client-side React Hook Form validation.
- Output: React escapes by default; no `dangerouslySetInnerHTML` except JSON-LD (serialized with `<` escaped) and our own escaped Markdown renderer.
- URL safety: user-supplied links must be `http(s)`; embeds only from an allow-list (YouTube, Vimeo, TikTok, Instagram, Facebook, LinkedIn) and are re-derived server-side from the URL, never stored as raw iframe HTML.
- Security headers: CSP (frame-src allow-list), `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options: DENY`, HSTS (Vercel adds on HTTPS).
- Spam/abuse: honeypot field, minimum fill time, DB-backed rate limiting per hashed IP (works on serverless), length limits.
- Secrets: secret/service key only in server modules marked `import 'server-only'`; env validation fails fast.

## 9. Market/pattern research — AI agency, studio and case-study sites

Sources: web search summaries of agency/studio sites and case-study guidance (patterns only; nothing copied).

Common, effective patterns:
- Hero with a **specific positioning statement** + one primary CTA ("Start a project") + one secondary ("See our work").
- **Proof through work, not claims:** case studies structured as Problem → Approach → Architecture → Results, with real screenshots/diagrams and measured outcomes.
- Capability/stack section grouped by outcome (automation, agents, integrations), not by logo walls.
- Clear process section (Discover → Design → Build → Operate).
- Team section with real people, roles and links — strong trust signal for small studios.
- Filters on work index (category/technology) and "related projects" on case-study pages.
- Minimal, fast pages; dark themes with a single accent colour are common in AI studios — consistent with the existing brand.

## 10. Creator media kits & sponsorship pages

Sources: [Uscreen – media kit guide](https://www.uscreen.tv/blog/content-creator-media-kit/),
[Sponsorship media kit: what brands check](https://howtofindsponsorshipopportunities.com/blog/sponsorship-media-kit-guide/),
[InfluenceFlow – demographics guide](https://influenceflow.io/resources/media-kits-with-audience-demographics-the-complete-2026-guide/).

- Standard sections: who you are, **audience demographics** (the section brands care most about), reach & engagement per platform,
  previous partnerships, collaboration formats/packages, content examples, contact.
- Typical length 2–4 pages → the `/media-kit` page is structured as printable sections so a PDF can be generated from it later (print stylesheet included).
- Many creators publish "rates on request"; B2B/professional audiences command higher rates → public page states
  **"Partnership rates are available upon request."** Internal `standard_rate`/`minimum_rate`/notes live in an admin-only table.
- Audience numbers must be real → audience/demographic blocks render **only when the admin has entered data**; otherwise the section is hidden (no placeholders that look like data).

## 11. CMS dashboard patterns

- Left sidebar with grouped sections; list pages with search, filter chips, status badges, bulk-safe row actions; edit pages with
  a main column (content) and side column (publish state, featured/pinned, SEO, media).
- Explicit publish state and "View on site" link; destructive actions confirm; toasts for results.
- Dashboard shows **real counts only** (e.g. new inquiries, drafts, published items, storage usage from `media_assets`), no synthetic charts.

## 12. Resulting decisions (summary)

1. Next.js 16 App Router, RSC-first, ISR + on-demand revalidation, `proxy.ts` for session refresh.
2. Supabase Postgres as the database; **Drizzle** for all application queries (server-only); RLS as defense-in-depth for the public Data API.
3. Supabase Auth, invite-only, roles in `profiles` + permissions in `role_permissions`; checks in code **and** in RLS.
4. Supabase Storage for all binary media; PostgreSQL stores only metadata (`media_assets`).
5. Sensitive data isolated in dedicated tables with no public policies.
6. SEO via Metadata API + JSON-LD derived from visible content + DB-driven sitemap.
7. Email via a provider-agnostic interface (Resend adapter, console fallback); inquiry stored before any email attempt.
8. Vercel Analytics + Speed Insights; no custom analytics dashboards.
