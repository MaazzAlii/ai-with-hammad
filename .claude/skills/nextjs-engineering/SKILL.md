---
name: nextjs-engineering
description: Next.js 16 App Router specifics for this repo: async request APIs, proxy.ts, metadata, caching/revalidation, route conventions.
---
# Next.js 16 engineering

Read the bundled docs in `node_modules/next/dist/docs/01-app/` for anything not listed here.

## Rules
- `params`, `searchParams`, `cookies()`, `headers()` are async. Type pages with `PageProps<"/route/[slug]">` (run `npm run typecheck`, which runs `next typegen`).
- Middleware is `src/proxy.ts` (export `proxy`, Node runtime). Keep it thin: session refresh + redirect only.
- Public pages: `export const revalidate = 3600` + `generateStaticParams` for dynamic slugs. After CMS writes call `revalidatePublicSite()` (`src/server/revalidate.ts`).
- `revalidateTag` needs a second arg in v16 (`revalidateTag(tag, "max")`); prefer the existing path revalidation.
- Metadata: `generateMetadata` → `buildMetadata()` from `src/lib/seo.ts`. Root layout sets `metadataBase` and title template.
- Server actions are public POST endpoints: always `runAction` + `authorize` + zod + `assertId`.
- `after()` from `next/server` for work after the response (email notifications).
- No `cacheComponents` in this project; don't add `"use cache"` without an architecture decision.

## Adding a public route
1. `src/app/(site)/<route>/page.tsx` with `generateMetadata`, `revalidate`, JSON-LD breadcrumb.
2. Add to `src/app/sitemap.ts` and `tests/e2e/public.spec.ts` + `seo.spec.ts` lists.
