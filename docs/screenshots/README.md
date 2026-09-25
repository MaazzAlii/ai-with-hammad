# Screenshots — v2 QA (Liquid Glass redesign + link in bio)

Captured from production (https://ai-with-hammad2.vercel.app) on 2026-09-26 after commit `81616e4`,
with headless Microsoft Edge (Playwright). File names end in the scroll position in pixels.

| Screenshot | What it checks |
| --- | --- |
| `home-desktop-light-0.png` | Hero, floating navbar, agent-run visual (1440 px, light) |
| `home-desktop-light-900.png` | Scrolled navbar (tighter capsule), positioning + services cards |
| `home-desktop-light-1800.png` | Case-study grid |
| `home-desktop-dark-0.png` | Dark mode hero |
| `home-mobile-light-0.png`, `-900.png` | Phone layout (390 px): stacked CTAs, full-width cards |
| `mobile-menu-0.png`, `mobile-menu-dark-0.png` | New drop-down mobile menu (replaces the bottom tab bar) |
| `projects-0.png` | Projects index, segmented filter pills |
| `services-0.png` | Services index |
| `contact-0.png` | Contact form, "What happens next", contact list |
| `sponsorship-mobile-0.png` | Sponsorship page, phone, dark |
| `links-mobile-0.png` | `/links` before any links are added (empty state) |
| `portal-login-0.png` | Client portal sign-in (dark) |

## Test results (this release)

| Check | Result |
| --- | --- |
| `npm run lint`, `npm run typecheck` | Pass |
| Unit tests (`vitest --project unit`) | 100 / 100 pass (incl. WCAG contrast for light **and** dark) |
| `npm run build` | Pass — every `/admin/**` and signed-in `/portal/**` route is dynamic (ƒ) |
| Public pages 360–1920 px | No horizontal overflow; all images have alt; all fields labelled |
| Production deploy | Live; `/links` 200 |

## Not yet verified (needs a signed-in session)

- Admin screens and the dashboard data issue — the automated browser was not signed in, and signing in with a
  password/captcha must be done by a person. The admin layout is now `force-dynamic` (it previously built several
  admin pages as static), which is the most likely cause of "dashboard shows no data".
- `/admin/links` and `/links` with real links — run `supabase/migrations/20260926_bio_links.sql` first.
