# Final report — AI With Hamad platform

_Date: 2026-09-24 · Branch `claude/ai-hamad-agency-platform-j478py` · PR [MaazzAlii/ai-with-hammad#1](https://github.com/MaazzAlii/ai-with-hammad/pull/1)_

**Status:** the application is built, tested and ready to deploy. What remains are **owner-only steps**:
creating the Supabase project and the Vercel project, and setting up the domain. I had no accounts or
credentials for those services. Each step is documented. Nothing below is claimed unless it was verified.

## Verification summary

| Check | Result |
| --- | --- |
| `npm run lint` | 0 errors, 0 warnings |
| `npm run typecheck` (`next typegen && tsc`) | clean |
| Unit tests (`tests/unit`, 9 files) | **74 passed** |
| Database tests (`tests/db`, 3 files; fresh DB built from the setup SQL **twice**) | **31 passed** |
| E2E (`tests/e2e`, 10 files; real Supabase Auth + storage emulator enforcing real RLS) | **56 passed** (clean reset) |
| `next build` | success (also `BUILD_STANDALONE=1` for Docker) |
| Lighthouse 12 (local production build) | see below (measured before the v2 redesign; re-run after deploy) |

### How it was tested

Docker image pulls, GitHub releases and the official documentation sites were blocked by this
session's network policy. So instead of `supabase start`:
- The DB tests run against **PostgreSQL 16**.
- The E2E tests run against **real Supabase Auth (GoTrue)**, compiled from source through the Go module proxy.
- They also use a small **Storage emulator** (`scripts/local/supabase-gateway.mjs`). It writes `storage.objects`
  as the caller's Postgres role, so the real storage RLS policies apply.

The only Storage feature it does not emulate is TUS resumable upload.

### Lighthouse (production build served locally; mobile = simulated slow 4G and 4× CPU slowdown)

| Page | Mobile (Perf/A11y/BP/SEO) | Desktop | Mobile LCP / CLS / TBT |
| --- | --- | --- | --- |
| `/` | 92 / 100 / 100 / 100 | 100 / 100 / 100 / 100 | 3.3 s / 0 / 40 ms |
| `/projects` | 95 / 100 / 100 / 100 | 100 / 100 / 100 / 100 | 2.9 s / 0 / 60 ms |
| `/services/workflow-automation` | 93 / 100 / 100 / 100 | 100 / 100 / 100 / 100 | 3.2 s / 0 / 50 ms |
| `/sponsorship` | 89 / 100 / 96 / 100 | 100 / 100 / 96 / 100 | 3.6 s / 0 / 100 ms |
| `/media-kit` | 93 / 100 / 96 / 100 | 100 / 100 / 96 / 100 | 3.1 s / 0 / 40 ms |
| `/contact` | 90 / 100 / 100 / 100 | 100 / 100 / 100 / 100 | 3.2 s / 0 / 200 ms |

The 96 Best-Practices scores come from a YouTube thumbnail (`i.ytimg.com`) returning 403. That host is
blocked **in this sandbox only**. Two Lighthouse findings were fixed during the review:
- An accessible-name mismatch on the logo link.
- A CSP console report caused by Zod's JIT probe (Zod now runs jitless).

## Version 2 — client portal, testimonials, captcha, redesign

| Feature | Where |
| --- | --- |
| **Client login & portal** (`/portal/login`): clients message the team directly; staff with `messages.*` see and answer every conversation; unread badges; email notice without the message body | `src/app/portal/*`, Admin → Messages |
| **Testimonials + 1–5 star ratings** submitted by clients after work → approved and published by managers+ → `/testimonials` and homepage (average from published reviews only) | Portal → Feedback, Admin → Testimonials |
| **Clients admin**: organisations, invite/deactivate portal users | Admin → Clients |
| **FAQ** module (homepage + contact) | Admin → FAQs |
| **WhatsApp**: floating button and contact card, number and prefilled message editable | Admin → Settings → General |
| **Everything visitors see is editable**: agency name, logo (also used on the loading screen), contact details, phone, address, hours, tech stack, team photos, navigation, legal pages | Admin → Settings / Team / Media |
| **Founders fixed**: Hammadullah and Maaz Ali are seeded and locked. Their names and slugs can't be changed or deleted (DB trigger); photos, bios and links are editable | Admin → Team |
| **Captcha** on contact, sponsorship, staff login, password reset and client login (built-in signed challenge, or Cloudflare Turnstile via env) | `src/server/captcha.ts` |
| **Redesign**: animated AI-agent pipeline hero, aurora background, tech marquee, reveal-on-scroll, lazy rendering below the fold (`content-visibility`), branded navigation loader | `src/components/site/*` |
| **Self-hosting**: Dockerfile, docker-compose + Caddy (HTTPS), `/api/health` | `docs/HOSTING_PLAN.md` |

Issues found and fixed during v2:
- Soft 404s caused by `loading.tsx`.
- A Drizzle correlated-subquery bug in unread counts.
- A helper exported from a `"use server"` file, which made it publicly callable; a guard test now prevents this.
- Client accounts could pass the staff check; fixed in both code and SQL.

**Hosting advice** (sources in `docs/HOSTING_PLAN.md`):
- Vercel alone is enough; Render isn't needed.
- Vercel's free Hobby plan is **non-commercial only**, so Pro (from about $20/month) is the compliant choice for the agency.
- Supabase free pauses after 7 days of inactivity.
- In 5–6 months, move to Contabo with the included Docker setup.

## What was built

### Architecture
Next.js 16 App Router with Server Components by default. Public pages use ISR (`revalidate = 3600`)
and every CMS change triggers on-demand revalidation. Admin pages are dynamic and marked `noindex`.
`src/proxy.ts` refreshes sessions. The security boundary is server-side: `requireStaff`,
`requirePagePermission`, and `authorize` inside every server action, plus Postgres RLS. Drizzle handles
data access through a `server-only` DAL that returns DTOs. Details: `docs/PLAN.md`, `CLAUDE.md`.

### Repository
- **One commit per file** as you asked. 355 tracked files; about 11.6k lines of TypeScript in `src/`.
- Pushed to `claude/ai-hamad-agency-platform-j478py`.
- The original page is preserved at `docs/legacy/index.html`.
- The repository was not renamed to `ai-with-hamad-agency`. That is an owner action; see `docs/GITHUB.md`.

### Database
`supabase/AI_WITH_HAMAD_SETUP.sql` is idempotent. It contains:
- 11 enums and 35 tables (v2 adds clients, message threads, messages, testimonials and FAQs): identity/RBAC, media, services, team, projects (media, metrics, tags, features, team, services), social platforms, content and metric snapshots, sponsorship partners, packages, **separate internal rates table** and inquiries, contact inquiries and notes, settings, navigation, legal documents, audit logs, rate limits.
- UUIDs, foreign keys with deliberate `on delete` behaviour, indexes, partial unique slugs, CHECK constraints (slugs, http(s)/https URLs, path safety, rate ordering), `updated_at` triggers and soft delete.
- Seed data: roles and 29 permissions, starter settings and navigation, legal templates, and the 3 services from the original site.

Drizzle mirrors the schema in `src/db/schema.ts`. A test keeps the two consistent (tables, columns, types, nullability).

### Storage
- 10 buckets (9 public and `private-documents`), each with MIME allow-lists and size limits.
- `storage.objects` policies: writes need `media.*` permissions, `site-assets`/SVG need `settings.write`, executable extensions are blocked, and anonymous users cannot list files.
- Upload pipeline: `prepareUpload` (validation, server-generated path) → the browser uploads directly (standard ≤ 6 MB, TUS above) → `finalizeUpload` (checks the stored object's size and MIME) → `media_assets` record.

### Authentication & RBAC
- Supabase Auth, invite-only. New auth users get an **inactive viewer** profile.
- Sign in, password reset, invite confirmation (`/auth/confirm`), set password, and sign-out that revokes all sessions and checks the request origin.
- Roles: owner, admin, manager, editor, viewer. The role-to-permission matrix lives in the DB, is mirrored in code, and a test checks they match.
- Editors' publish flags are ignored server-side.
- Admins cannot touch owners. The last active owner cannot be demoted or deactivated (enforced by a DB trigger).
- Deactivating a user revokes their sessions.

### CMS / CRM
- **Dashboard:** real counts and recent activity.
- **Projects:** every case-study field, taxonomy, metrics, features, team, services, SEO, and publish/feature/pin flags.
- **Media editor:** gallery images, screenshots, diagrams, uploaded video, YouTube, Vimeo, documents and links, with drag-and-drop ordering, posters and alt text.
- **Other modules:** services and their features; team members and social links; content items with metric history; social platforms; sponsorship packages, **internal rates** (managers and above) and partners.
- **Media library:** upload, preview, search, filter, sort, rename, alt text and captions, replace, copy URL, usage list, and delete (blocked while the file is in use).
- **Settings:** 8 sections, including audience data and notification recipients. Also navigation, legal pages, users (invite, role change, deactivate) and the audit log.
- **Inquiries:** pipeline filters and counts, search, status, priority, assignment, notes and timestamps.

### Public site
- **Pages:**
  - Home: hero, positioning, services, pinned or featured projects, capabilities, process, core team, top content, CTAs.
  - About.
  - Services and service detail.
  - Projects with crawlable filters, and a full case-study page: narrative sections, outcomes, video facades, gallery lightbox, resources, team, related work.
  - Team and member profiles.
  - Content with platform filter and "audience favourites", and content detail with a click-to-load embed and dated metrics.
  - Sponsorship: who we are, audience, categories, platforms, top and campaign content, partners, formats, why partner, and the inquiry form. It shows *"Partnership rates are available upon request."*
  - Printable media kit.
  - Contact with the CRM form.
  - Privacy, terms and cookie policies.
  - 404 and error pages.
- **No fabricated data:** every section hides itself when it has no data. The legacy page's invented stats (2,400 hours, 35 clients) were dropped.

### Video
- YouTube and Vimeo are parsed from an allow-list into privacy-enhanced embeds and shown behind click-to-load facades, so no iframe loads with the page.
- Uploaded video uses `preload="none"` with a poster image.
- Third-party videos are never downloaded.
- `VideoObject` JSON-LD is added only when a video is actually embedded.

### Sponsorship & content
- Internal rates live in their own table, with no public or anonymous path to them.
- E2E tests check that the rate values and negotiation notes never appear in `/sponsorship` or `/media-kit` HTML, or on an editor's admin page.
- Content metrics are entered manually as snapshots, so official API integrations can add rows later. Nothing is scraped.

### SEO
- `buildMetadata` gives every page a unique title and description, a canonical URL, Open Graph and Twitter tags.
- Filtered views are `noindex, follow`.
- The sitemap is built from the DB and lists published content only.
- robots.txt disallows admin areas, and blocks everything unless `NEXT_PUBLIC_ALLOW_INDEXING=true`.
- JSON-LD: Organization, WebSite, BreadcrumbList, Service, Person, CreativeWork, Article and VideoObject, always matching visible content.
- A dynamic OG image, a manifest, and an icon.

### Analytics
Vercel Analytics and Speed Insights are mounted only on Vercel. There is one custom event,
`inquiry_submitted`, which carries no personal data. There are no custom dashboards.

### Email
- A provider interface with a Resend adapter and a console fallback.
- The inquiry is **stored first**; the notification is sent in `after()`.
- Send timeouts are handled, and `email_status` is recorded on the inquiry.
- Notifications are plain text, and the subject line cannot inject headers.

### Security
See `docs/SECURITY_AUDIT.md`: 18 areas reviewed. One issue was found and fixed: ids passed as bound
server-action arguments are client-controlled, so they are now validated with `assertId()`. The report
also lists the residual trade-offs, such as the CSP allowing `'unsafe-inline'` scripts so pages can stay ISR.

### Testing
`docs/TESTING.md` covers:
- The local stack, including the GoTrue build.
- One seeded session per role.
- Per-context IPs, so rate limits don't interfere between tests.
- DB assertions inside the E2E tests.

### Performance
- Server Components and ISR.
- Self-hosted variable fonts.
- `next/image` with `sizes` and aspect-ratio containers (CLS is 0 on every audited page).
- Video facades.
- Admin-only libraries stay out of public bundles.
- Batched queries and indexes.

### Deployment
- `docs/SUPABASE_SETUP.md`: project setup, auth settings, email templates, creating the first owner, keys.
- `docs/VERCEL_DEPLOYMENT.md`: env var matrix, previews vs production, custom domain, post-deploy checks, VPS portability notes.
- `.env.example` lists every variable.

## Tasks

- **106 of 107 COMPLETED** (with verification notes in each file under `docs/tasks/`); 107 (merge to main) is being done now.
- Tasks 095–107 cover v2.
- **7 BLOCKED**, each with its exact blocker:

| Task | Blocker |
| --- | --- |
| 042 Large upload strategy | The TUS path (> 6 MB) needs real Supabase Storage; the local emulator lacks TUS. Standard uploads are verified. |
| 056 User management | The invite email needs a real Supabase project with SMTP. Role changes, deactivation and owner protection are verified. |
| 074 Analytics | Only runs on Vercel; verify after the first deploy. |
| 089 Supabase project setup | No Supabase account or credentials in this session. |
| 090 Vercel deployment | No Vercel account or credentials in this session. |
| 091 Custom domain | Domain and DNS are yours to configure; depends on 090. |
| 092 Production environment | Keys must be created in your accounts; depends on 089/090. |

## Your next steps (about 30–45 minutes)

1. Supabase: create the project → run the SQL → apply the auth settings and email templates → create your user → `select private.promote_to_owner('you@…');`
2. Vercel: import the repo → set the env vars (Production: `NEXT_PUBLIC_ALLOW_INDEXING=true`) → deploy.
3. Add the domain → set `NEXT_PUBLIC_SITE_URL` → redeploy → add the domain to Supabase redirect URLs.
4. Confirm the brand spelling (Hamad vs Hammad) in Admin → Settings. Upload a logo and the founders' photos. Set the WhatsApp number, phone and address. Add real projects, content and audience data.
5. Add clients in Admin → Clients and invite their portal users. Invites need SMTP (step 1).
6. Optional: create a Cloudflare Turnstile widget and set its two env vars.
7. Upload a > 6 MB video once, to confirm TUS works (task 042). Invite a teammate to confirm SMTP works (task 056).
8. Have the legal templates reviewed by a lawyer. Choose a license; the README currently says "proprietary".

## Optional future improvements

- Server-side PDF export of the media kit (the print styles are already in place).
- Official API providers for YouTube, TikTok and Instagram metrics (the `content_metrics` table already supports them).
- A GitHub Actions CI job (lint, typecheck, unit tests, build, DB tests with a Postgres service).
- Magic-byte verification of uploads, and image-variant generation.
- MFA enforcement for owners and admins.
- Preview links for drafts (for example, signed draft URLs).
- A full-text search index if content volume grows.
