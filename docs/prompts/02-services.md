# 02 — Services

## Index (`/services`)
`PageHeader` (eyebrow "Services", title "What we build", one-sentence description) → 1/2/3-column `ServiceCard`
grid with `data-reveal="group"` → `EmptyState` (BriefcaseBusiness icon) when none are published.
`ServiceCard`: tinted icon tile (rotates 3° on hover), title, summary, up to 3 feature ticks, "Learn more →".

## Detail (`/services/[slug]`)
- `PageHeader` with `Breadcrumb` ("‹ Services"), 56 px icon tile, title, summary, primary CTA
  "Discuss this service" → `/contact?service=<id>` (pre-selects the service in the form).
- Body: optional cover (`MediaImage`, `shadow-panel`) + Markdown description (`.prose-site`, max 68ch).
- Right column ≥ 1024 px: sticky `glass-panel` "What's included" with check-circle list.
- Related projects grid. JSON-LD `Service` + breadcrumb.

## Admin inputs used
title, slug, icon (allow-list), summary, description (Markdown), cover, features[], SEO title/description, publish/feature flags.
