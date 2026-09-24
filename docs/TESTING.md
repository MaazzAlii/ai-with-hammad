# Testing

| Suite | Command | What it proves |
| --- | --- | --- |
| Unit (52) | `npm run test:unit` | validation, upload security, embeds/URL safety, Markdown XSS escaping, JSON-LD escaping, RBAC matrix, audit scrubbing, email failure handling, action error mapping, WCAG contrast |
| DB (25) | `npm run test:db` | SQL applies twice (idempotent), Drizzle ⇄ SQL consistency, RLS per role, rates isolation, storage bucket config + policies, owner protection, constraints |
| E2E (47) | `npm run test:e2e` | every public route, inquiries stored, honeypot, login/logout/inactive/open-redirect/CSRF, CMS create/publish/pin/unpublish, uploads, video facade, content metrics, CRM pipeline, rates never public, settings, role restrictions, media upload/delete, storage RLS, SEO, responsive widths, basic a11y |

`npm test` runs unit + DB. `npm run check` = lint + typecheck + tests + build.

## Local stack (for DB and E2E tests)

`supabase start` needs Docker images; where those aren't available this repo ships a lighter stack:

1. **PostgreSQL 16** (local install) on port 54322.
2. **Supabase Auth (GoTrue)** — the real server, built from source:
   ```bash
   mkdir -p /tmp/gotrue && cd /tmp/gotrue
   curl -sSLo auth.zip "https://proxy.golang.org/github.com/supabase/auth/@v/$(curl -s https://proxy.golang.org/github.com/supabase/auth/@v/master.info | jq -r .Version).zip"
   unzip -q auth.zip && cd github.com/supabase/auth@*/ && chmod -R u+w .
   sed -i '/internal\/forks\/godotenv/d' go.mod && GOFLAGS=-mod=mod go build -o /tmp/gotrue/auth .
   cp -r migrations /tmp/gotrue/migrations
   ```
3. **Gateway** `scripts/local/supabase-gateway.mjs` on :54321 — proxies `/auth/v1` to GoTrue and emulates the Storage endpoints the app uses (upload, delete, move, public read). It verifies the caller's JWT and writes `storage.objects` **as the caller's role**, so the real storage RLS policies are enforced. TUS resumable uploads are not emulated.

```bash
GOTRUE_BIN=/tmp/gotrue/auth GOTRUE_MIGRATIONS=/tmp/gotrue/migrations RESET=1 bash scripts/local/up.sh
node scripts/local/keys.mjs            # local anon + service JWTs for .env.local
```

`.env.local` for the local stack:

```
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_ALLOW_INDEXING=true
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<ANON from keys.mjs>
SUPABASE_SECRET_KEY=<SERVICE from keys.mjs>
DATABASE_URL=postgres://postgres@127.0.0.1:54322/aiwh_e2e
IP_HASH_SALT=local-dev-salt
LOCAL_SUPABASE_STACK=true
```

Create a local owner: POST `/auth/v1/admin/users` with the service key, then
`select private.promote_to_owner('you@example.test');`.

With Docker available you can instead use the Supabase CLI (`supabase start`) and run the setup SQL against it.

## E2E

```bash
npm run build
npm run test:e2e      # resets the local DB, seeds one user per role, runs Playwright
# PW_CHROMIUM_PATH=/path/to/chrome to use a preinstalled Chromium
```

Tests run serially (shared DB). Each browser context sends its own `X-Forwarded-For` so per-IP rate limits don't interfere.

## Lighthouse

```bash
npm run build && npm start &
npx lighthouse http://localhost:3000/ --preset=desktop --only-categories=performance,accessibility,best-practices,seo
```
Results from this project's review are recorded in `docs/FINAL_REPORT.md`.
