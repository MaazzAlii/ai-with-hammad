# Design system — Liquid Glass

A calm, iOS-inspired interface: a neutral canvas, soft ambient light, and translucent glass
surfaces in a clear hierarchy. Tokens live in `src/app/globals.css` (Tailwind v4 `@theme` + utilities);
components consume them — never hard-coded colours.

## Brand

- Name is a CMS setting (`Settings → General → Site name`, default **AI With Hamad**).
- Logo: app-icon style monogram (`LogoMark` in `src/components/site/logo.tsx`) until a logo is uploaded.
- Voice: specific, calm, technical. Describe what was built and measured. No superlatives, no
  unverifiable numbers, no "10x", no ranking promises.

## Colour

Light is the default for everyone. The **theme toggle** (sun/moon button in the navbar, portal, admin, sign-in
and `/links`) switches to dark, which is the studio's original look: near-black canvas, cyan/teal accent, a faint
grid texture and the cyan→teal gradient on primary buttons. The choice is saved in `localStorage` and applied
before first paint (`THEME_BOOT_SCRIPT` in `src/lib/theme.ts`), so there is no flash. Tailwind's `dark:` variant
follows the toggle (`html[data-theme="dark"]`), not the OS setting. Buttons and icons are identical in both themes;
only colours change, and every text pair is contrast-tested. Both palettes are checked for WCAG AA in
`tests/unit/contrast.test.ts` (dark overrides sit after the `/* dark */` marker in `globals.css`).

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `bg` | `#f2f3f6` | `#05090e` | canvas |
| `surface` / `-2` / `-3` | `#fff` / `#f6f7f9` / `#eceef2` | `#0b131b` / `#111c26` / `#172532` | solid surfaces, fills |
| `fg` / `muted` / `subtle` | `#0f1115` / `#4d5562` / `#646b77` | `#e8f1f2` / `#9bb1ba` / `#7d949e` | text hierarchy |
| `accent` / `accent-2` | `#0a6c9e` / `#0e7c74` | `#22d3ee` / `#2dd4bf` | primary CTA, active state, links |
| `danger` / `success` / `warning` | status | status | alerts, badges |
| `whatsapp` | `#25d366` | — | WhatsApp controls only |

Accent is reserved for the primary action, the current selection and links. Everything else is neutral.

## Glass hierarchy

Not everything is glass. Layers, back to front:

| Layer | Utility | Used for |
| --- | --- | --- |
| Canvas | `bg-bg` | page background |
| Ambient light | `.ambient` (root layout) | fixed, blurred light sources that drift very slowly |
| Chrome | `glass-chrome` | floating header, tab bar, admin sidebar, save bar |
| Panel | `glass-panel` | primary surfaces: hero visual, forms, closing CTAs, sticky asides |
| Card | `glass-card` | repeated secondary surfaces: service/value/testimonial cards, lists |
| Float | `glass-float` | small floating controls over media (badges, play, lightbox arrows) |
| Sheet | `glass-sheet` | dialogs and bottom sheets (near-opaque, content must stay legible) |
| Solid | `surface-solid` | tables and dense UI |

Each material combines translucency, backdrop blur + saturation, a hairline (`--glass-line`), an inner
top highlight (`--glass-edge`) and a soft top sheen. Without `backdrop-filter` support they fall back to solid.
`Card` exposes the materials as `tone="card" | "panel" | "solid"`.

## Typography

- System stack first (SF Pro on Apple devices), **Inter** (self-hosted variable) elsewhere; JetBrains Mono for code only.
- Hierarchy through size, weight (400/500/600 — rarely bold), opacity and spacing.
- Headings: tight tracking (`-0.022em`, h1 `-0.032em`), `text-wrap: balance`. Body 16px/1.6, `text-wrap: pretty`.
- `.eyebrow` = small semibold accent label above headings; `.label-caps` = quiet uppercase meta label.

## Shape, depth & spacing

| Token | Size | Elements |
| --- | --- | --- |
| `rounded-control` | 12px | inputs, selects, chips, thumbnails |
| `rounded-button` | full | buttons are capsules |
| `rounded-card` | 24px | cards, panels, sheets (large panels go to 28–32px) |
| `rounded-media` | 18px | images, video, galleries |

Radii are concentric: inner elements are smaller than their container. Shadows: `shadow-card`,
`shadow-panel`, `shadow-float`, `shadow-glow` (primary CTA only). Container `container-page` (max 75rem,
20px gutters → 32px ≥ 640px); sections are separated by space (`py-14 sm:py-20`), not rules.

## Motion

Tokens: `--ease-spring` (iOS sheet curve), `--ease-out-soft`, `--ease-snap`; durations 160/260/480ms.

- **Buttons**: scale 1.015 on hover (pointer devices), 0.97 on press. `pressable` / `lift` give other
  elements the same tactile response.
- **Reveal on scroll**: `data-reveal="item"` or `data-reveal="group"` (children stagger). Driven by
  `RevealObserver`; content is visible without JavaScript and under reduced motion.
- **Page transitions**: `template.tsx` (site, portal, admin) fades each page in with a short blur/translate.
- **Overlays**: `.anim-overlay`, `.anim-pop` (dialog; becomes a bottom sheet on phones), `.anim-sheet`.
- **Navigation**: the header capsule thickens on scroll; the desktop nav's selection pill glides between items.
- Everything is disabled under `prefers-reduced-motion: reduce`.

## Navigation

- Desktop: one floating capsule — logo, segmented nav (`NavLinks`), primary CTA.
- Phones/tablets: the same floating capsule with logo, compact CTA and a menu button that drops a glass panel
  down from the top (`MobileMenu`, Radix dialog). Icons are matched to CMS links by path (`nav-icons.ts`).
- Client portal: segmented control in the header (under it on phones). Admin: floating glass sidebar (sheet on phones).
- Link in bio (`/links`): standalone page without site chrome.

## Components

Primitives (`src/components/ui`): Button (primary/secondary/ghost/outline/danger/link; sm/md/lg/icon),
Input/Textarea/NativeSelect/Label, Card (tones), Badge (default/glass/accent/success/warning/danger),
Dialog (modal → sheet), Switch (iOS proportions), Spinner, Alert (with icon), Table, Skeleton (shimmer), Separator.
Site: Section/SectionHeading/PageHeader/Breadcrumb/ViewAllLink/EmptyState, MediaImage/MediaPlaceholder,
ProjectCard, ServiceCard, TeamCard, ContentCard, PlatformCards, TestimonialGrid, FaqList, MediaGallery,
VideoEmbed (facade), VideoPlayer, AgentVisual, AuthShell, FormSuccess, BrandIcon (Simple Icons, monochrome), MobileMenu.

## Print (media kit)

`@media print` switches to black-on-white, drops glass and the ambient layer, hides `.no-print`,
avoids breaking `.print-avoid` blocks and starts `.print-break` sections on new pages.
