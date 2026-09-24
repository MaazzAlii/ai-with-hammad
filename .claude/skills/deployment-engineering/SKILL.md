---
name: deployment-engineering
description: Deploy to Vercel + Supabase: environment variables, domains, preview vs production, and post-deploy verification.
---
# Deployment engineering

Follow `docs/VERCEL_DEPLOYMENT.md` and `docs/SUPABASE_SETUP.md`.

1. Supabase: create project → run `supabase/AI_WITH_HAMAD_SETUP.sql` → Auth settings (disable signup, URLs, email templates) → create first user → `select private.promote_to_owner('…')`.
2. Vercel: import repo, framework Next.js, Node 20+/22. Env vars per environment (Production vs Preview) from `.env.example`; `NEXT_PUBLIC_ALLOW_INDEXING=true` **only** in Production.
3. Domain: add apex + www in Vercel, redirect www → apex (or reverse), set `NEXT_PUBLIC_SITE_URL` to the canonical origin, add it to Supabase Auth redirect URLs, redeploy.
4. Verify: `/robots.txt`, `/sitemap.xml`, canonical tags, login, upload, contact form (inquiry stored + email), security headers (`curl -I`).
5. Never paste secrets into code, issues or commits. Rotate keys if exposed.
