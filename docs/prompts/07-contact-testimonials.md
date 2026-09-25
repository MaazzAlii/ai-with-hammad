# 07 — Contact, testimonials, FAQ

## Contact (`/contact`)
Two columns ≥ 1024 px: form in a `glass-panel` (2-column fields ≥ 640 px; filled inputs with soft focus ring;
required asterisk in accent; captcha; privacy note + full-width-on-phone submit with `Spinner` while sending;
success replaces the form with `FormSuccess`) | aside: "What happens next" numbered steps, WhatsApp card
(green brand circle, chevron), contact details as a grouped list. FAQ below.
Labels the e2e tests rely on: "Name", "Email", "Company", "Service", "What would you like to build?", "Send message".

## Testimonials (`/testimonials`)
Header with a glass rating pill ("4.9 out of 5 from N reviews") only when real reviews exist → masonry grid →
CTAs "Start a project" / "Client? Leave feedback". No Review/AggregateRating JSON-LD (self-serving reviews).
Phase 2: video testimonials rendered as click-to-play facades inside the same card style.

## FAQ
`<details>` accordion inside one `glass-card`; plus icon rotates to ×; height animates where supported.
