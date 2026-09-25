# AI With Hamad — agency platform

Production platform for **AI With Hamad**, an AI engineering, automation, technology consulting and
content-creator agency: public website (services, case studies, team, creator content, sponsorship +
media kit, contact) and an invite-only CMS/CRM that manages all of it.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui-style components ·
Supabase (Postgres, Auth, Storage) · Drizzle ORM · Zod · Vercel.

## Features

- **Public site** — homepage (pinned projects, services, capabilities, process, core team, top content),
  services, case studies with galleries/diagrams/video/metrics, team profiles, creator content with metrics,
  sponsorship page + printable media kit, contact, legal pages. Every section hides when empty — no fabricated data.
- **CMS** — projects (media editor with drag-and-drop, YouTube/Vimeo/uploads), services, team, content + metric
  snapshots, social platforms, sponsorship packages/partners + **confidential internal rates**, media library,
  settings, navigation, legal pages, users (invite-only), audit log, real-number dashboard.
- **CRM** — contact & sponsorship inquiries: status pipeline, priority, assignment, notes.
- **Security** — RBAC (owner/admin/manager/editor/viewer) enforced server-side and in Postgres RLS, validated
  direct-to-storage uploads, rate limiting, CSP, audit logging. See `docs/SECURITY_AUDIT.md`.
- **SEO** — per-page metadata, canonical URLs, sitemap, robots, JSON-LD, OG images.

## Getting started

```bash
npm ci
cp .env.example .env.local        # fill in Supabase + database values
npm run dev                       # http://localhost:3000
```

Database: run `supabase/AI_WITH_HAMAD_SETUP.sql` on your Supabase project and create the first owner —
see [`docs/SUPABASE_SETUP.md`](docs/SUPABASE_SETUP.md). Deployment: [`docs/VERCEL_DEPLOYMENT.md`](docs/VERCEL_DEPLOYMENT.md).

## Scripts

| Script | |
| --- | --- |
| `npm run dev` / `build` / `start` | Next.js |
| `npm run lint` · `npm run typecheck` | ESLint · `next typegen && tsc` |
| `npm test` | unit + database/RLS tests (DB tests need local Postgres) |
| `npm run test:e2e` | Playwright against the local stack (`docs/TESTING.md`) |
| `npm run check` | lint + typecheck + tests + build |

## Documentation

| Doc | |
| --- | --- |
| [`CLAUDE.md`](CLAUDE.md) | engineering rules for humans and agents |
| [`docs/PLAN.md`](docs/PLAN.md) · [`docs/tasks/`](docs/tasks) | architecture and task system |
| [`docs/RESEARCH.md`](docs/RESEARCH.md) · [`docs/INITIAL_AUDIT.md`](docs/INITIAL_AUDIT.md) | research and initial audit |
| [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md) | tokens, typography, components |
| [`docs/SUPABASE_SETUP.md`](docs/SUPABASE_SETUP.md) · [`docs/VERCEL_DEPLOYMENT.md`](docs/VERCEL_DEPLOYMENT.md) | setup and deployment (incl. custom domain, VPS notes) |
| [`docs/TESTING.md`](docs/TESTING.md) · [`docs/SECURITY_AUDIT.md`](docs/SECURITY_AUDIT.md) | tests and security review |
| [`docs/GITHUB.md`](docs/GITHUB.md) | branches, commits, PRs |
| [`docs/FINAL_REPORT.md`](docs/FINAL_REPORT.md) | what was built and verified |

The original single-page site is preserved at [`docs/legacy/index.html`](docs/legacy/index.html).

## License

Proprietary — all rights reserved unless the owner chooses a license. (The previous README mentioned
MIT but no LICENSE file existed.)
