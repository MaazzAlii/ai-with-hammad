# 10 — Admin (CMS/CRM)

## Shell
- Staff sign-in at the non-guessable path (`/kasayhobro`), `AuthShell`, captcha, rate-limited.
- Desktop: floating `glass-chrome` sidebar (inset 12 px, 28 px radius), grouped nav, active item = accent fill,
  count pills for new inquiries/unread messages, user card + View site / Sign out.
- Phones: glass top capsule "Admin" + menu button → sidebar slides in as a sheet.
- The layout is `force-dynamic` — admin pages must never be prerendered or cached.
- Save bar: sticky `glass-chrome` capsule at the bottom of long forms.

## Screen recipe
`AdminPageHeader` (breadcrumbs as accent links with chevrons, title, description, actions) → content.
Lists: `SortableList` + `EntityRow` (thumb, title, meta, inline flag toggles). Forms: `AdminForm` + `FormSection`
(`glass-card`), 2–3 column field grids on desktop, main column + 20 rem side column for publishing/media/SEO.
Tables: `Table` (`surface-solid`). Feedback: toasts (top-centre, system theme); destructive actions confirm.

## Dashboard
Welcome + live stat tiles (label, big tabular number, sub-line, lift on hover, deep links) → latest inquiries and
recent activity panels. Every tile shows a real count or 0 — never a spinner that never ends; failures render the
admin error boundary with "Try again".

## Customisation map (what the owner can change without code)
Settings (brand name/logo/contact/hero/sections/SEO/social/sponsorship) · Navigation · Legal pages · every content
type · media library · link in bio · FAQs · testimonials moderation · users & roles.
Phase 2: homepage section builder with layout variants, accent colour picker (contrast-checked), admin profile page.
