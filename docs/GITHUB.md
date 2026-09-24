# GitHub

## Repository

| Item | Value |
| --- | --- |
| Current repository | `MaazzAlii/ai-with-hammad` (existing; this session's GitHub access is scoped to it) |
| Preferred name | `ai-with-hamad-agency` |
| Package name | `ai-with-hamad-agency` (`package.json`) |
| Default branch | `main` |
| Working branch | `claude/ai-hamad-agency-platform-j478py` → PR [MaazzAlii/ai-with-hammad#1](https://github.com/MaazzAlii/ai-with-hammad/pull/1) |

**Repository name.** The directive prefers `ai-with-hamad-agency`. A new repository was **not** created:
the existing repository already holds the project history, and creating/renaming repositories is an
owner action outside this session's scoped access. To rename (GitHub keeps redirects from the old URL):

1. GitHub → repository → **Settings → General → Repository name** → `ai-with-hamad-agency` → Rename.
2. Update local clones: `git remote set-url origin https://github.com/MaazzAlii/ai-with-hamad-agency.git`
3. Vercel follows the rename automatically (reconnect the Git integration if prompted).

## Getting the code locally

```bash
git clone https://github.com/MaazzAlii/ai-with-hammad.git ai-with-hamad
cd ai-with-hamad
git checkout claude/ai-hamad-agency-platform-j478py   # until the PR is merged into main
npm ci
cp .env.example .env.local   # fill in values
```

## Branch strategy

- `main` — always deployable; Vercel **Production** deploys from it.
- Feature branches `feat/<topic>`, `fix/<topic>`, `claude/<topic>` → PR → review → squash or merge into `main`.
- Every PR gets a Vercel **Preview** deployment (indexing disabled via `NEXT_PUBLIC_ALLOW_INDEXING=false`).
- Never force-push `main`. Protect `main` (Settings → Branches): require PR + passing checks.

## Commit conventions

Conventional Commits: `feat:`, `fix:`, `perf:`, `security:`, `test:`, `docs:`, `chore:`, `refactor:`
with an optional scope (`feat(admin): …`). The owner prefers **one commit per file** — the history of
this project follows that. Never commit `.env*` (except `.env.example`), `.tmp/`, `.next/`, reports.

## Pull-request expectations

- Description: what/why, screenshots for UI, migration notes for SQL changes, test evidence.
- Checks that must pass locally (and in CI once configured): `npm run lint`, `npm run typecheck`,
  `npm run test:unit`, `npm run test:db`, `npm run build`; E2E for flows touched.
- Schema changes: SQL + Drizzle updated together; forward migration file for existing databases.
- Security-sensitive changes (auth, RBAC, RLS, storage, public DAL): reviewer runs the checklist in
  `.claude/skills/security-engineering/SKILL.md`.

## Suggested CI (not yet enabled)

A GitHub Actions workflow needs a Postgres service for DB tests and cannot run GoTrue without a
binary; suggested jobs: `lint` + `typecheck` + `test:unit` + `build` (no secrets needed — the DAL
renders empty states without `DATABASE_URL`), and `test:db` with a `postgres:16` service.
