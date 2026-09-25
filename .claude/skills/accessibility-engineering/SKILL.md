---
name: accessibility-engineering
description: WCAG 2.2 AA practices for components and pages in this codebase.
---
# Accessibility engineering

- Landmarks: header/nav/main#main/footer; skip link in `(site)/layout.tsx`; one `h1` per page; no skipped heading levels.
- Forms: every control has a `<label for>` (use `Field`/`TextField`), errors via `aria-invalid` + `aria-describedby`, form-level errors in `Alert role="alert"`. Required marker is CSS-only (label text stays clean).
- Interactive: native buttons/links; Radix for dialogs/switches (focus trap, Escape, focus return); `aria-current="page"` for active nav; `aria-label` on icon-only buttons.
- Media: meaningful `alt` or `alt=""` for decorative; video has a title; nothing autoplays.
- Colour: tokens verified in `tests/unit/contrast.test.ts` (≥ 4.5:1). Don't convey state by colour alone (badges have text).
- Motion: all animation respects `prefers-reduced-motion` (globals.css).
- Targets ≥ 40px (buttons `h-10`, chips `min-h-9/10`).
- Tests: `tests/e2e/a11y.spec.ts` (alt, labels, names, skip link) + keyboard checks in `public.spec.ts`.
