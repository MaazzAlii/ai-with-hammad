---
name: ui-ux-engineering
description: Design decisions for pages and CMS screens: layout, hierarchy, empty states, feedback, and consistency with the AI With Hamad design system.
---
# UI/UX engineering

Source of truth: `docs/DESIGN_SYSTEM.md` and tokens in `src/app/globals.css`.

## Page recipe (public)
1. `PageHeader` (eyebrow + h1 + one-sentence description) → `Section`s separated by space (no rules); group reveals with `data-reveal`.
2. One primary CTA per viewport (`Button` primary); secondary actions use `secondary`/`ghost`.
3. Proof over claims: case studies, real metrics with context, dated follower counts.
4. Every section has an empty behaviour: hide it, or show `EmptyState` on index pages.

## CMS recipe
1. `AdminPageHeader` (title, breadcrumbs, actions incl. `StatusBadges`).
2. Main column content, right column (20rem) for publishing, media, taxonomy, SEO.
3. Feedback: toasts via `AdminForm`; destructive actions via `ActionButton` with `confirm`.
4. Read-only mode for users without write permission (`AdminForm disabled`).

## Do / don't
- Do keep radius consistent: control < button < card < media.
- Do respect reduced motion; animations are subtle (hover lift ≤ 4px, scale ≤ 1.03).
- Don't stack more than one sticky bar per page (use `AdminForm compact` for secondary forms).
- Don't show numbers without a source/date.
