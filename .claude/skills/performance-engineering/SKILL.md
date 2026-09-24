---
name: performance-engineering
description: Keep Core Web Vitals healthy: rendering strategy, images, fonts, video, bundles and database queries.
---
# Performance engineering

- Rendering: RSC + ISR for public pages; avoid `cookies()/headers()` in public routes (makes them dynamic). Filters use `searchParams` only on index pages.
- LCP: hero/cover via `MediaImage priority` only for the first above-the-fold image; fixed aspect ratios.
- Fonts: `src/app/fonts.ts` (`next/font/local`, `display: swap`, mono not preloaded).
- Video: `VideoEmbed` facade (iframe only after click, youtube-nocookie), `VideoPlayer preload="none"` with poster.
- Bundles: keep dnd-kit, tus-js-client, radix dialogs out of public server components' client trees; check `next build` output sizes.
- DB: explicit columns, batched child queries, indexes for every filter (`is_published, sort_order`), `prepare: false` for the pooler, small pool (`max: 5`).
- Measure: Lighthouse against `npm run build && npm start` (docs/TESTING.md#lighthouse); Vercel Speed Insights in production.
