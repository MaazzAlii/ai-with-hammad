# Vercel deployment

First deployment: **Vercel (Next.js) + Supabase (Postgres/Auth/Storage)**.

## 1. Prerequisites

- Supabase project set up per [`SUPABASE_SETUP.md`](./SUPABASE_SETUP.md).
- Code on GitHub (`main` = production).

## 2. Create the Vercel project

1. <https://vercel.com/new> → Import `MaazzAlii/ai-with-hammad`.
2. Framework preset **Next.js** (auto). Build command `next build`, install `npm ci`, Node.js **22.x** (≥ 20.9).
3. Add environment variables (below) **before** the first deploy, then Deploy.

## 3. Environment variables

| Name | Production | Preview | Notes |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `https://<your-domain>` | leave unset (falls back to the production Vercel URL) or a staging URL | canonical URLs, sitemap, OG, JSON-LD |
| `NEXT_PUBLIC_ALLOW_INDEXING` | `true` | `false` | anything but `true` ⇒ `noindex` + robots disallow all |
| `NEXT_PUBLIC_SUPABASE_URL` | project URL | same or a staging project | |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | publishable key | | |
| `SUPABASE_SECRET_KEY` | secret key | | **Sensitive**; invites, storage deletes, signed URLs |
| `DATABASE_URL` | pooler URI (6543) | | **Sensitive** |
| `IP_HASH_SALT` | `openssl rand -hex 32` | different value | **Sensitive**; required in production |
| `RESEND_API_KEY` | optional | optional | email notifications |
| `EMAIL_FROM` | `AI With Hamad <notifications@your-domain>` | | verified sender domain in Resend |
| `INQUIRY_NOTIFICATION_EMAIL` | comma-separated | | more recipients in Admin → Settings |

Mark secrets as **Sensitive** in Vercel. Production requires `DATABASE_URL`, Supabase URL/key and
`IP_HASH_SALT` (the app refuses to run without them when `VERCEL_ENV=production`).

## 4. Analytics

Enable **Analytics** and **Speed Insights** in the Vercel project (Observability tab). The components
are already mounted (only on Vercel). One custom event is tracked: `inquiry_submitted` (form type only, no PII).

## 5. Deployments

- **Preview**: every PR/branch push. Not indexable. Use a staging Supabase project if you want to test destructive changes.
- **Production**: merge to `main` (or "Promote to Production").
- Rollback: Vercel → Deployments → previous deployment → **Promote**. Database changes are not rolled back automatically — keep migrations additive.

## 6. Custom domain

1. Vercel → Project → **Settings → Domains** → add `your-domain.com` and `www.your-domain.com`.
2. Choose the canonical host (e.g. apex) and set the other to **redirect (308)** to it.
3. DNS at your registrar: apex `A 76.76.21.21` (or the values Vercel shows), `www CNAME cname.vercel-dns.com`. HTTPS certificates are issued automatically.
4. Set `NEXT_PUBLIC_SITE_URL=https://your-domain.com` (Production) → **Redeploy** (value is inlined at build time).
5. Supabase → Auth → URL Configuration: Site URL = the domain; add it to redirect URLs.
6. Resend: verify the domain (SPF/DKIM records) before using it in `EMAIL_FROM`.

### Post-deploy checks

```bash
curl -sI https://your-domain.com | grep -Ei 'content-security-policy|x-frame-options|strict-transport'
curl -s https://your-domain.com/robots.txt
curl -s https://your-domain.com/sitemap.xml | head
```

- View source on a project page: `<link rel="canonical" href="https://your-domain.com/projects/…">`.
- Sign in at `/login`, upload an image, publish a project, submit the contact form (check Admin → Inquiries and email).
- Google Search Console: add the domain property, submit `/sitemap.xml`. (No ranking is guaranteed.)

## 7. Future VPS migration (portability notes)

The app is a standard Next.js server; nothing is Vercel-only except the optional analytics components.

- **Run**: `npm ci && npm run build && npm start` (Node 22) behind Nginx/Caddy with TLS; or `output: "standalone"` in `next.config.ts` + Docker.
- **Headers**: set/overwrite `X-Forwarded-For` at the reverse proxy (rate limiting and IP hashing read it). Vercel does this automatically.
- **ISR cache**: default file-system cache works on a single instance; multiple instances need a shared cache handler (`cacheHandler` in next.config).
- **Images**: `next/image` optimization runs on the Node server (install `sharp`, already a Next dependency).
- **Database**: any Postgres 15+ works for app data, but Auth/Storage are Supabase services. Options: keep Supabase (simplest), self-host Supabase (Docker), or replace Auth/Storage (larger change: `src/lib/supabase/*`, storage pipeline, RLS helpers use `auth.uid()`).
- **Analytics**: remove `@vercel/analytics`/`speed-insights` or replace with a self-hosted tool.
- **Cron/after()**: `after()` works on a long-running Node server.
