# Product Requirements Document — AI With Hamad platform

| | |
| --- | --- |
| Owner | Maaz Ali, Hammadullah |
| Status | Living document — v2 (Liquid Glass redesign + link-in-bio) |
| Production | https://ai-with-hammad2.vercel.app (custom domain to follow) |
| Repository | https://github.com/MaazzAlii/ai-with-hammad (push to `main` → Vercel deploys) |
| Related | `docs/DESIGN_SYSTEM.md`, `docs/prompts/` (page-by-page build instructions), `CLAUDE.md` (engineering rules) |

---

## 1. Summary

AI With Hamad is an AI engineering + content-creator studio run by two founders. The platform is:

1. **A public website** that proves capability (case studies, services, team, content) and converts visitors into
   projects, sponsorships and followers.
2. **A link-in-bio page** (`/links`) that replaces a paid Linktree for TikTok, Instagram, YouTube and LinkedIn bios —
   including affiliate and sponsor links with honest labels and click counts.
3. **A client portal** where clients message the team and leave ratings/testimonials (text, and video in phase 2).
4. **A CMS/CRM admin panel** where the founders customise everything the public sees — without code.

Quality bar: it must read as a product engineered by AI engineers — calm, fast, precise — not a template.

## 2. Goals & non-goals

**Goals**
- G1 Win qualified project inquiries (contact form, WhatsApp) from the site.
- G2 Turn short-form-content viewers into site visitors via `/links`, and measure which links they click.
- G3 Collect verifiable social proof (client-portal ratings, testimonials) — never fabricated.
- G4 Let non-developers change *every* visible string, image, link, section and ordering from the admin.
- G5 First-class experience on phones, tablets, laptops and large monitors; light and dark mode.

**Non-goals (for now)**
- Public self-signup for clients (accounts are created/verified by staff — see §6.3).
- Payments/checkout, e-commerce, a blog engine separate from "Content".
- Scraping social platforms for metrics (manual entry or official APIs only).

## 3. Users

| Persona | Needs | Primary surfaces |
| --- | --- | --- |
| Prospective client (founder / ops lead) | "Can they build my thing? Proof? How do I start?" | Home, Projects, Services, Contact |
| Follower from TikTok/Instagram | One tap to the thing mentioned in the video | `/links` |
| Brand / sponsor | Audience, formats, past partners, contact | Sponsorship, Media kit |
| Active client | Message the team, track replies, leave feedback | Client portal |
| Founder / staff | Edit everything, handle inquiries, see what works | Admin |

## 4. Scope — what exists today (v2)

Public: Home, Services (+detail), Projects/case studies (+detail with galleries, diagrams, video, metrics, resources),
Team (+profiles), Content (+detail), Testimonials, Sponsorship, Media kit (printable), About, Contact, Legal, 404,
**Link in bio (`/links`)**. Admin: dashboard, projects, services, team, content, social platforms, testimonials, FAQs,
sponsorship, media library, messages, clients, inquiries, settings, navigation, legal, users, audit log,
**Link in bio**. Portal: conversations, new message, feedback. Staff login lives at a non-guessable path
(currently `/kasayhobro`) and is protected by captcha, rate limiting and server-side permission checks.

## 5. Functional requirements

### 5.1 Public website
- FR-1 Every section renders only when it has real CMS data (honesty rule, `CLAUDE.md` §1).
- FR-2 Projects support **multiple images** (screenshots, diagrams), video (upload or YouTube/Vimeo embed),
  documents and **external links** — all managed per project in admin (`ProjectMediaEditor`). Galleries open in a lightbox.
- FR-3 Navigation: floating glass navbar on all sizes; on phones/tablets a menu button opens a drop-down panel.
- FR-4 Contact and sponsorship forms: validation, captcha, honeypot, rate limit, stored in Postgres first, email optional.
- FR-5 SEO: unique metadata, canonical URLs, JSON-LD for visible content, sitemap, robots.

### 5.2 Link in bio (`/links`) — new in v2
- FR-10 Standalone, phone-first page: brand mark, name, tagline, social icon row, featured links (large),
  regular links, a section per founder (their profile socials + links assigned to them), partner links.
- FR-11 Link types: `link`, `social` (icon row), `affiliate`, `sponsor`. Affiliate/sponsored links are always
  labelled and carry `rel="sponsored"`, with a one-line disclosure — required for FTC/ASA-style compliance.
- FR-12 Scheduling: optional "show from" / "hide after" (e.g. a campaign link that expires).
- FR-13 Click tracking: every link goes through `/go/<id>` (302), which increments `click_count` after responding.
  Only live links resolve; destinations come from the DB (no open redirect). `/go/` is disallowed in robots.
- FR-14 Admin: add/edit/delete, drag to reorder, toggle featured/published inline, assign to a founder,
  pick an icon, see clicks per link and in total, open the live page.

### 5.3 Client portal
- FR-20 Staff create a client company and invite portal users by email (verified by the invite link).
- FR-21 Clients message the team (threaded), see unread state, get replies in the portal; WhatsApp shortcut.
- FR-22 Clients submit a 1–5 rating + testimonial, with explicit consent to publish; staff moderate before publishing.
- FR-23 *(Phase 2)* Video testimonials: client uploads a short video (≤ 60 s, private bucket) or shares a link;
  staff approve; public card shows a click-to-play facade. Works for non-disclosable projects: rating + role, no project name.

### 5.4 Admin customisation
- FR-30 Settings: site name (single source for the brand spelling), logo, tagline, contact, WhatsApp, hero copy,
  CTAs, positioning, capabilities, process, tech stack, SEO defaults, social links, sponsorship data.
- FR-31 Navigation (header/footer/legal) editable and orderable.
- FR-32 *(Phase 2)* **Section builder for the homepage**: toggle, reorder and pick a layout variant per section
  (e.g. services as grid / list / carousel; projects as 3-up / featured + list). Stored as a typed JSON setting,
  rendered through an allow-list of variants — never raw HTML.
- FR-33 *(Phase 2)* Theme controls: accent colour from a vetted palette (contrast-checked), default light/dark/system.
- FR-34 Admin profile: name, avatar, password change; owners manage staff roles.

## 6. Non-functional requirements

- **Performance**: LCP < 2.5 s on 4G mid-range phone; public pages ISR (1 h); images via `next/image`; no autoloaded iframes.
- **Accessibility**: WCAG 2.2 AA contrast in both themes (unit-tested), keyboard access, focus rings, reduced motion respected.
- **Security**: RLS on every table; permissions from DB; zod on every input; captcha + rate limits on public forms and
  logins; no secrets in client code; admin/portal responses `noindex` and always dynamic.
- **Reliability**: admin never statically prerendered (`force-dynamic`); errors shown in-app with retry; audit log for all mutations.
- **Responsiveness**: verified at 360, 390, 430, 768, 1024, 1280, 1440, 1920 px with no horizontal overflow.

## 7. Information architecture

```
/                     Home
/services, /services/[slug]
/projects, /projects/[slug]
/team, /team/[slug]
/content, /content/[slug]
/testimonials  /about  /contact  /sponsorship  /media-kit
/links                Link in bio (standalone)      /go/[id]  click-through
/portal/login  /portal  /portal/messages/[id|new]  /portal/feedback
/kasayhobro           Staff sign-in (non-guessable)  /admin/**  CMS/CRM
```

## 8. Data model additions (v2)

`bio_links` (id, title, url, description, kind, icon, team_member_id → team_members, is_featured, is_published,
starts_at, ends_at, click_count, sort_order, timestamps, deleted_at). Permission `links.write` (owner, admin, manager, editor).
Existing projects need the one-off SQL in `supabase/migrations/20260926_bio_links.sql`.

## 9. Analytics & success metrics

| Metric | Source | Target (first 90 days) |
| --- | --- | --- |
| Qualified inquiries / month | `contact_inquiries` | ↑ month over month |
| `/links` click-through rate | `bio_links.click_count` ÷ page views | > 35 % |
| Portal feedback submissions | `testimonials` (source=portal) | ≥ 1 per delivered project |
| Core Web Vitals | Vercel Speed Insights | All "good" |

## 10. Release plan

| Phase | Contents | State |
| --- | --- | --- |
| v2.0 | Liquid Glass redesign (site, portal, admin), mobile navbar, link-in-bio + click tracking, admin hardening | This release |
| v2.1 | Homepage section builder + layout variants, accent/theme controls, admin profile page | Next |
| v2.2 | Video testimonials, per-link UTM builder, `/links` analytics chart (clicks over time table) | Later |
| v2.3 | Custom domain, newsletter capture, content auto-import via official YouTube Data API | Later |

## 11. Open questions

1. Final brand spelling: "Hamad" or "Hammad"? (One setting: Admin → Settings → Site name.)
2. Custom domain and when to switch `NEXT_PUBLIC_SITE_URL`.
3. Which affiliate programmes will be listed first (so disclosure copy can be reviewed)?
4. Is a clients-can-request-access flow wanted, or does staff always invite?
