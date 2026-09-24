# Initial Repository Audit

_Date: 2026-09-24 · Branch: `claude/ai-hamad-agency-platform-j478py` · Remote: `github.com/MaazzAlii/ai-with-hammad`_

## 1. Current repository state

| Item | Finding |
| --- | --- |
| Commits | 1 (`64d3778 Initial commit: AI with Hammad agency website`) |
| Tracked files | `index.html` (15.8 KB), `README.md`, `.gitignore` |
| `package.json` | **None.** No build tooling, no dependencies. |
| Framework | None — a single hand-written HTML page with inline CSS and ~40 lines of inline JS |
| Environment files | None (`.env*` absent) |
| Deployment config | None (no `vercel.json`, no CI workflows, no Dockerfile) |
| Claude Code config | No `CLAUDE.md`, no `.claude/` directory, no project skills |
| Tests | None |

**Conclusion:** this is effectively a **new project**. The existing page is a one-screen marketing
landing page, not an application. Nothing in it can be extended into the required platform
(CMS, auth, database, storage), so the platform is built fresh with Next.js.

## 2. What the existing `index.html` contains

- Dark "glassmorphism" theme: background `#05090e`, cyan `#22d3ee` / teal `#2dd4bf` accents,
  fonts **Sora** (display), **Manrope** (body), **JetBrains Mono** (labels).
- Sticky nav, hero ("Automate Your Business with n8n & AI Agents"), 3 service cards
  (n8n Workflow Automation, Custom API Integrations, Agentic AI Systems), a stats bar, CTA band, footer.
- Good practices already present: `prefers-reduced-motion` handling, `:focus-visible` outlines,
  `aria-labelledby` on sections, safe-area insets.

## 3. Problems found

1. **Fabricated / unverifiable statistics.** The stats bar hard-codes `2,400+ Hours Automated`,
   `120+ Custom Workflows Built`, `35+ Happy Clients`. There is no data source for these numbers.
   The directive forbids fabricated statistics, so they are **not carried over**. Metrics in the new
   platform only come from CMS-entered, per-project data.
2. **Brand spelling inconsistency.** Repository/README use "AI with **Hammad**"; the build directive
   uses "AI WITH **HAMAD**". The new platform stores the brand name in `site_settings` (default
   `AI With Hamad`, per the directive) so the owner can correct it in Admin without a deploy.
3. No SEO metadata beyond `<title>` (no description, canonical, Open Graph, structured data, sitemap, robots).
4. Contact is a bare `mailto:` link — no inquiry capture, no CRM.
5. No content management — every change requires editing HTML.
6. Google Fonts loaded via render-blocking CSS link (the new app uses `next/font` self-hosting).
7. `README.md` claims "MIT License" but no `LICENSE` file exists.

## 4. What is reused

- **Visual identity:** colour palette (cyan/teal on near-black), font pairing (Sora / Manrope /
  JetBrains Mono) and the monospace "eyebrow" label treatment are carried into the new design tokens
  (`src/app/globals.css`) so the brand stays recognisable.
- **Service positioning:** the three service descriptions become **seed data** for the `services`
  table (editable/removable in Admin).
- **Accessibility habits:** reduced-motion and focus-visible patterns.
- The original page is preserved at `docs/legacy/index.html` for reference (moved with `git mv`, history intact).

## 5. What is replaced

- Static HTML → Next.js 16 App Router (Server Components by default).
- Hard-coded content → PostgreSQL (Supabase) + Drizzle ORM + Admin CMS.
- `mailto:` CTA → stored inquiries with CRM pipeline + optional email notification.

## 6. What is missing (and is built by this project)

Database schema, RLS, Storage buckets/policies, auth + RBAC, admin CMS, media library, project/case-study
system, team, content-creator showcase, sponsorship + media kit, inquiry CRM, SEO (metadata, sitemap,
robots, JSON-LD, OG images), legal pages, analytics, tests (unit / DB / E2E), deployment docs.

## 7. Environment & tooling audit (this session)

| Capability | Status |
| --- | --- |
| Node / npm | Node 22.22, npm 10.9 — OK (Next 16 requires ≥ 20.9) |
| npm registry | Reachable |
| Official doc sites (nextjs.org, supabase.com, developers.google.com, orm.drizzle.team, ui.shadcn.com) | **Blocked by egress policy.** Research used web search results plus the **version-matched Next.js docs bundled in `node_modules/next/dist/docs/`** |
| GitHub web / API | Blocked for direct HTTP; GitHub access is via the session's GitHub MCP integration, scoped to `MaazzAlii/ai-with-hammad` |
| Docker | Daemon starts, but Docker Hub / ECR pulls are blocked (rate limit / 403) → `supabase start` is **not** possible |
| PostgreSQL | PostgreSQL 16 binaries available → local cluster used for DB/RLS tests |
| Supabase Auth (GoTrue) | Built from source via the Go module proxy (`github.com/supabase/auth`) → **real GoTrue** runs locally for auth E2E tests |
| Supabase Storage API | Not obtainable → a small, documented storage emulator (`scripts/local/supabase-gateway.mjs`) implements the endpoints the app uses and **enforces the real `storage.objects` RLS policies** by executing as the caller's role |
| Chromium / Playwright | Pre-installed at `/opt/pw-browsers` |
| Claude Code skills | Only built-in/session skills (`session-start-hook`, `code-review`, `security-review`, etc.). The requested `/ui-ux-pro-max-skill` and "gstack" skills are **not installed** in this session. Project skills are created under `.claude/skills/`. |
| MCP integrations | GitHub (scoped), Canva, Google Drive/Calendar, Claude Docs. No Supabase or Vercel MCP → Supabase project creation and Vercel deployment are **owner actions** (documented). |
| shadcn CLI | Registry (ui.shadcn.com) blocked → components are written by hand following shadcn/ui source conventions on top of `radix-ui` + `class-variance-authority` + `tailwind-merge`; `components.json` is included so the CLI works later. |
