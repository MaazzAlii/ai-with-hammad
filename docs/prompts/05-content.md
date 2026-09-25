# 05 — Creator content

## Index (`/content`)
`PageHeader` → "Where to follow" `PlatformCards` (follower counts always with "as of <date>") → "Audience
favourites" (high-performing) → library with platform filter pills (horizontal scroll on phones) → `ContentCard` grid.
`ContentCard`: 16:9 (3:4 for portrait/TikTok) thumbnail, glass platform badge, centred glass play button, title,
date + views/likes/comments with icons and `tabular-nums`.

## Detail (`/content/[slug]`)
Breadcrumb, platform · category eyebrow, title, published date. Left: click-to-load `VideoEmbed` (never autoload
third-party iframes). Right: metrics as a `glass-panel` grid (value over label) + "Metrics as of", Markdown
description, "View on <platform> ↗". Then "More on <platform>". JSON-LD `VideoObject` for video content.
