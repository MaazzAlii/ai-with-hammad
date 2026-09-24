# Hosting plan: Vercel now, Contabo VPS later

_Written 2026-09-24. Free-tier terms change often, so check each provider's pricing page before you decide._

## Short answer

- **Vercel alone is enough.** This app is a standard Next.js app with Supabase for the database, login and file storage. It does not need Render.
- **Heads-up on Vercel's free (Hobby) plan.** It is for *non-commercial, personal use only*. Vercel counts advertising a product or service as commercial, and an agency website does that. The compliant option is **Vercel Pro (from about $20/month)**. Sources: [Vercel Hobby plan](https://vercel.com/docs/plans/hobby), [Fair use guidelines](https://vercel.com/docs/limits/fair-use-guidelines), [Pricing](https://vercel.com/pricing).
- **Render's free tier works but hurts the site.** Free web services go to sleep after about 15 minutes without visitors. The next visitor then waits 30–60 seconds for it to wake up. That is bad for first impressions and for SEO on a public agency site. ([example report](https://dev.to/hassanyosuf/how-to-keep-your-render-free-tier-app-alive-without-paying-for-it-o8e))
- **Supabase free works to start with.** Limits: 500 MB database, 1 GB file storage, 50k monthly active users, 2 projects. It **pauses a project after 1 week of inactivity**. ([Supabase pricing](https://supabase.com/pricing), [project pausing](https://supabase.com/docs/guides/platform/free-project-pausing))
- **In about 5–6 months, move the app to Contabo.** Use the Docker setup in `Dockerfile` and `deploy/`. Keep Supabase for the database, login and storage. That is the simplest path.

## Phase 1 — Vercel + Supabase (now)

| Piece | Choice | Notes |
| --- | --- | --- |
| App hosting | Vercel (Pro recommended; Hobby only if you accept the commercial-use restriction) | `vercel.json` sets the Next.js framework preset. Every PR gets a preview URL. |
| Database, login, files | Supabase free | Run `supabase/AI_WITH_HAMAD_SETUP.sql` once (`docs/SUPABASE_SETUP.md`). |
| Email notifications | Resend free tier (optional) | Without it, inquiries and messages are still saved and shown in Admin. |
| Captcha | Built-in (no setup) or Cloudflare Turnstile (free) | Set `NEXT_PUBLIC_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY` to switch. |
| Analytics | Vercel Web Analytics / Speed Insights | Only runs on Vercel. |

### Staying within free limits

- **Videos:** use YouTube or Vimeo links for long videos. The 1 GB storage limit fills quickly with uploaded video. Images are fine.
- **Supabase pausing:** normal site traffic, admin work and portal messages usually count as activity. If the site might go a week with no traffic, upgrade Supabase (Pro projects never pause) or check the dashboard weekly. Supabase emails a warning about a week before pausing.
- **Vercel bandwidth:** Hobby includes about 100 GB/month, which is plenty for this site. Images are served in optimized AVIF/WebP.

## Phase 2 — Contabo VPS (in about 5–6 months)

Everything is in the repository:

| File | Purpose |
| --- | --- |
| `Dockerfile` | Multi-stage build. Produces the small `standalone` Next.js server. Runs as a non-root user and includes a health check on `/api/health`. |
| `deploy/docker-compose.yml` | The app plus **Caddy**, which gets and renews HTTPS certificates automatically. |
| `deploy/Caddyfile` | Redirects www to the main domain, compresses responses, sets HSTS, and overwrites `X-Forwarded-For` so visitors can't fake their IP to get around rate limits. |

### Steps (Ubuntu VPS)

```bash
# 1. Server basics
apt update && apt install -y docker.io docker-compose-plugin ufw
ufw allow OpenSSH && ufw allow 80 && ufw allow 443 && ufw enable

# 2. Code + config
git clone https://github.com/MaazzAlii/ai-with-hammad.git && cd ai-with-hammad/deploy
cp ../.env.example .env        # fill in: DATABASE_URL, SUPABASE_SECRET_KEY, IP_HASH_SALT, RESEND_API_KEY, …
export DOMAIN=your-domain.com NEXT_PUBLIC_SUPABASE_URL=… NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=…

# 3. Point DNS (A records for @ and www) to the VPS IP, then:
docker compose up -d --build

# 4. Updates later
git pull && docker compose up -d --build
```

Then update the Supabase Auth Site URL and redirect URLs if the domain changed, and remove the domain from Vercel.

### What changes when leaving Vercel

- Vercel Analytics and Speed Insights stop, because they only load on Vercel. Add a self-hosted tool such as Umami or Plausible if you want analytics.
- Page caching (ISR) uses the server's disk. That is fine for one VPS. Running several servers would need a shared cache.
- Back up the database with Supabase backups (Pro) or a nightly `pg_dump` cron job.
- To leave Supabase entirely you would need self-hosted Supabase in Docker, or a rewrite of the login and storage layers. That is not recommended for the first move.

## Recommendation

1. **Now:** Vercel Pro + Supabase free.
   - If you must stay at $0 for the first months, Vercel Hobby works technically, but it breaks Vercel's terms for a commercial site. That decision is yours.
   - Don't use Render's free tier for the public website.
2. **Month 5–6:** Contabo VPS with the Docker setup above, keeping Supabase. Upgrade Supabase to Pro when you need backups, no pausing, or more storage.
