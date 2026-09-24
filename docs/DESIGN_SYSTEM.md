# Design system

Carried over from the original AI With Hammad page (near-black canvas, cyan/teal accent,
Sora/Manrope/JetBrains Mono) and formalised as tokens in `src/app/globals.css` (Tailwind v4 `@theme`).

## Brand

- Name is a CMS setting (`Settings → General → Site name`, default **AI With Hamad**). The original
  site used "Hammad" — confirm the preferred spelling and change it in one place.
- Logo: monogram fallback (`src/components/site/logo.tsx`) until a logo is uploaded in Settings.
- Voice: specific, calm, technical. Describe what was built and measured. No superlatives, no
  unverifiable numbers, no "10x", no ranking promises.

## Colour tokens

| Token | Value | Use |
| --- | --- | --- |
| `bg` | `#05090e` | page background |
| `surface` / `surface-2` / `surface-3` | `#0b131b` / `#111c26` / `#172532` | cards, inputs, hovers |
| `border` / `border-strong` | `#1e2e3b` / `#2b4050` | dividers, control borders |
| `fg` | `#e8f1f2` | primary text (17.4:1 on bg) |
| `muted` | `#9bb1ba` | secondary text (8.9:1) |
| `subtle` | `#7d949e` | meta text (6.3:1) |
| `accent` / `accent-2` | `#22d3ee` / `#2dd4bf` | CTAs, links, highlights |
| `accent-fg` | `#03181c` | text on accent |
| `danger` / `success` / `warning` | `#f87171` / `#34d399` / `#fbbf24` | status |

All pairs used for text are checked ≥ 4.5:1 in `tests/unit/contrast.test.ts`.

## Typography

- Display: **Sora** (headings, buttons). Body: **Manrope**. Labels/code/metrics: **JetBrains Mono**.
- Self-hosted variable fonts via `next/font/local` (no external requests).
- Scale: h1 `text-3xl → sm:text-5xl` (hero `text-4xl → sm:text-6xl`), h2 `text-2xl → sm:text-3xl`, body 16px/1.65, meta 12–14px.
- `.eyebrow` = mono, 0.72rem, 0.16em tracking, uppercase, teal.

## Radius (consistent, not everywhere-round)

| Token | Size | Elements |
| --- | --- | --- |
| `rounded-control` | 10px | inputs, selects, small chips, thumbnails |
| `rounded-button` | 12px | buttons |
| `rounded-card` | 16px | cards, panels, forms, alerts |
| `rounded-media` | 20px | all images, galleries, video, embeds |
| `rounded-full` | — | pills/badges, avatars |

## Spacing & layout

- Container `container-page`: max 76rem, 16px gutters (24px ≥ 640px).
- Sections: `py-14 sm:py-20`, separated by `border-t border-border`.
- Grids: 1 → 2 (sm) → 3 (lg) columns for cards; 2 → 4 for team.

## Elevation & motion

- Subtle borders first; `shadow-card` for panels; `shadow-glow` only on primary CTAs.
- Transitions 200–500ms `ease-out-soft`; hover lift ≤ 4px, image zoom ≤ 1.03. Disabled under reduced motion.

### Motion & "AI engineer" visuals (v2)

- **Agent pipeline** (`agent-visual.tsx`): an SVG of input → agent → tools → output, with animated dashed flows (`agent-flow`),
  pulsing nodes (`agent-pulse`) and a staggered run log (`agent-log`). Decorative.
- **Aurora** hero background (`aurora`): blurred gradient blobs, GPU transforms only.
- **Tech marquee** (`marquee`): the tech-stack list from Admin → Settings, duplicated for a seamless loop; pauses on hover.
- **Reveal on scroll** (`.reveal`): CSS scroll-driven animation (`animation-timeline: view()`), inside `@supports` —
  no JavaScript; unsupported browsers just show the content.
- **Lazy rendering** (`.cv-auto`): `content-visibility: auto` on below-the-fold sections.
- **Navigation loader**: logo + agency name from settings, shown only for slow navigations.
- All of the above are disabled under `prefers-reduced-motion: reduce`.

## Components

Primitives (`src/components/ui`): Button (primary/secondary/ghost/outline/danger/link; sm/md/lg/icon),
Input/Textarea/NativeSelect/Label, Card, Badge, Dialog, Switch, Alert, Table, Skeleton, Separator.
Site: Section/PageHeader/SectionHeading/EmptyState, MediaImage, ProjectCard, ServiceCard, TeamCard,
ContentCard, PlatformCards, MediaGallery (lightbox), VideoEmbed (facade), VideoPlayer, JsonLd, Markdown.
Admin: AdminForm + fields, RepeaterField, MediaField/MediaPicker/MediaUploader, SortableList,
EntityRow/FlagToggle, ActionButton (confirm), ProjectMediaEditor.

## Print (media kit)

`@media print` switches to black-on-white, hides `.no-print`, avoids breaking `.print-avoid` blocks and
starts `.print-break` sections on new pages — `/media-kit` can be saved as a PDF from the browser today
and rendered server-side later.
