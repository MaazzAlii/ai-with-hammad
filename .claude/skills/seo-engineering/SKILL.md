---
name: seo-engineering
description: Technical SEO for public pages: metadata, canonical URLs, sitemap, robots, structured data and indexing controls, following Google Search Essentials.
---
# SEO engineering

- Metadata: `buildMetadata({ title, description, path, image, type })` in `generateMetadata`. Titles unique; descriptions 70–160 chars, human-written.
- Canonical: absolute from `NEXT_PUBLIC_SITE_URL`. Filtered/paginated list views → `robots: { index: false, follow: true }`.
- Drafts/unknown slugs → `notFound()` (real 404). Admin/login → `NOINDEX` + `X-Robots-Tag` + robots disallow.
- Sitemap (`src/app/sitemap.ts`): only published canonical URLs with `lastModified`.
- robots (`src/app/robots.ts`): full disallow unless `NEXT_PUBLIC_ALLOW_INDEXING=true` (production only).
- JSON-LD (`src/lib/jsonld.ts`, `<JsonLd>`): Organization + WebSite (layout), BreadcrumbList (every page), Service, Person, CreativeWork, Article, VideoObject — only with data visible on that page.
- Images: meaningful `alt` (media library warns when missing), `next/image` sizes.
- Verify with `tests/e2e/seo.spec.ts`; after deploy submit the sitemap in Search Console and inspect key URLs.
- Never: keyword stuffing, doorway/location pages, fake reviews/ratings markup, ranking promises.
