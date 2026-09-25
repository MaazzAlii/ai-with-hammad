# 08 — Link in bio (`/links`) + admin (`/admin/links`)

## Public page (standalone — no site header/footer)
Phone-first column (max 32 rem), centred:
1. 80 px app-icon brand mark, site name, tagline.
2. Social icon row (links of type `social`) — 44 px glass circles with monochrome brand icons (`BrandIcon`).
3. Featured links — `glass-panel` rows, accent icon tile, larger title.
4. Regular links — `glass-card` rows: icon tile, title, optional subtitle, ↗ that nudges on hover.
5. One card per founder: avatar, name → profile, role, their social icons, links assigned to them.
6. "Partners & tools we use" — affiliate/sponsored links, each with a badge + one-line disclosure; `rel="sponsored"`.
7. Footer: "Visit the website" + "Work with us".
Every link goes through `/go/<id>` (counts the click, then 302). Only published links inside their schedule show.

## Admin
Header shows total clicks and "Open /links". Sortable list (drag handle), each row: title, meta
(type · owner · clicks · URL), inline Published/Featured toggles; expand to edit. Form fields: title, URL
(https or mailto), subtitle, type, icon, belongs to (brand or a team member), show from / hide after (UTC),
featured, published. Delete with confirmation.

## Ideas for later
UTM builder per link, clicks-over-time table, QR code download, A/B title test, "latest video" auto-link via YouTube API.
