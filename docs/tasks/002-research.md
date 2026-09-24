# 002 — External research

## Objective

Research current official guidance for every technology and product pattern in scope.

## Why This Matters

Framework APIs changed (Next 16 proxy, async params); decisions must rest on current docs.

## Dependencies

[001-repository-audit](001-repository-audit.md)

## Files Expected To Change

- `docs/RESEARCH.md`

## Implementation Requirements

- Use version-matched Next.js docs bundled in node_modules
- Cover Supabase auth/RLS/storage, Drizzle, Tailwind v4, shadcn, SEO, a11y, performance, security, media kits, CMS patterns
- Record source + architectural implication for each finding
- Document blocked sources honestly

## Acceptance Criteria

- [ ] RESEARCH.md contains findings and implications for all listed areas

## Verification

- Manual review

## Status

**PLANNED**
