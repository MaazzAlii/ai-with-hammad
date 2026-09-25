# 03 — Projects & case studies

## Index (`/projects`)
- `PageHeader` → filter rows (Category, Technology) as **segmented pills**: active = `bg-fg text-bg`, others
  `bg-fg/[0.05]`. On phones each row scrolls horizontally (no wrapping into 5 lines). Filtered URLs are `noindex`.
- Grid of `ProjectCard` (4:3 cover, Featured/Selected glass badges, arrow chip that rises on hover, category,
  title, 2-line summary, up to 3 tech badges). `EmptyState` with a "Clear filters" link when filters match nothing.

## Detail (`/projects/[slug]`) — the proof page
1. `PageHeader` with `Breadcrumb`, category eyebrow, title, subtitle; "Visit project ↗" / "Source" buttons if URLs exist.
2. Cover in a `glass-panel` frame (p-2, inner radius smaller than outer).
3. Two columns ≥ 1024 px: narrative (Overview, Problem, Approach, Architecture + diagrams, Implementation, Results)
   and a sticky aside (facts list with hairline dividers, technology badges linking to filtered index, topics,
   services, team avatars).
4. Key features (2-col `glass-card`s), Outcomes (`glass-panel` metric tiles — big tabular number + label + context),
   Video (facade embed or `preload="none"` player), Screenshots (`MediaGallery` + lightbox), Resources
   (grouped list rows: icon tile, title, caption, ↗).
5. Related projects, closing CTA panel.

## Multiple images & links (admin)
Each project owns an ordered media list (`ProjectMediaEditor`): images (type image/screenshot/diagram, alt text
required), uploaded video with poster, YouTube/Vimeo/TikTok embed URLs (allow-listed via `parseEmbed`),
documents, and **external links** (title + https URL + caption). Drag to reorder; any number of items. Diagrams
appear inside "Architecture", other images in "Screenshots".

## Honesty
Metrics need a label and context ("per week, measured over 30 days"). No client name when the project is not disclosable.
