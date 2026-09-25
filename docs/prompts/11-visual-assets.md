# 11 — Visual assets: 3D icons, imagery, light/dark

The UI is restrained; imagery carries the personality. Keep one consistent visual language.

## 3D icon set (service icons, empty states, hero accents)
- Style: soft **clay/glass 3D**, rounded geometry, single object per icon, 3/4 view from slightly above,
  studio lighting from top-left, soft contact shadow, no text, no faces, no logos.
- Palette: neutral white/pearl bodies with **one** accent in ocean blue `#0a6c9e` or teal `#0e7c74`; frosted-glass parts allowed.
- Output: 1024×1024 PNG, transparent background; export @1x 256 px and @2x 512 px WebP for the site.
- Dark mode: same icon works on dark — ensure the contact shadow is subtle and the object has a light rim.

**Image-generation prompt (template)**
> A single 3D icon of {object}, soft matte clay with a frosted glass element, pearl white with one ocean-blue (#0a6c9e)
> accent, rounded minimal geometry, isometric three-quarter view, soft studio lighting from the top left, gentle
> contact shadow, transparent background, no text, no logo, premium Apple-style product render, high detail, 1:1.

Objects: workflow automation → interlocking gears on a rail · agentic AI → small robot head with a glowing ring ·
API integrations → two plug connectors · RAG/knowledge → stacked frosted cards with a magnifier · analytics → rising
glass bars · security → rounded shield · chat → speech bubble · content → play button tile.

## Project imagery
- Covers 4:3, screenshots 16:10, diagrams on a white or near-black board with 1 px lines — never busy stock photos.
- Show the real product UI; blur or redact client data. Put device frames only when they add clarity.
- Upload multiple images per project (screenshots, diagrams) with meaningful alt text; the first image is the cover.

## Photography (team)
Natural light, neutral background, shoulders-up, consistent crop (3:4 for profiles, 4:3 in grids). Same edit on everyone.

## Light / dark
All vector UI adapts automatically through tokens. For raster art provide art that reads on both
`#f2f3f6` and `#0b0c0f`; if not possible, upload two variants and pick by `prefers-color-scheme` (future setting).
