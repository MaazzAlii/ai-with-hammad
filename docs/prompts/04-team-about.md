# 04 — Team, profiles, About

## Team (`/team`)
Portrait grid (4:3, `TeamCard`): photo or `MediaPlaceholder` with initials, name, role, 3-line bio.

## Profile (`/team/[slug]`)
Two columns ≥ 768 px: 3:4 portrait (`shadow-panel`) | name (`text-[2.5rem] sm:text-6xl`), role in `text-muted`,
location/website, bio, Markdown long bio, Skills (badges), Elsewhere (secondary small buttons with ↗ — these come
from the team member's social links). Then "Projects with <first name>". JSON-LD `Person` with `sameAs`.
The founders (Hammadullah, Maaz Ali) are locked records — editable content, but they cannot be deleted or renamed.

## About (`/about`)
`PageHeader` (CMS title + intro) → Markdown body (large) → values as `glass-card`s → featured team → closing
`glass-panel` CTA "Want to work with us?".
