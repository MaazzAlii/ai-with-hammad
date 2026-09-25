# 103 — AI-engineer UI redesign

## Objective

Next-level visual design: animated agent pipeline hero, aurora, tech marquee, reveal-on-scroll, testimonials and FAQ sections.

## Why This Matters

The site must look like the work of AI engineers while staying fast and accessible.

## Dependencies

[017-public-layout](017-public-layout.md), [069-performance](069-performance.md)

## Files Expected To Change

- `src/app/(site)/page.tsx`
- `src/components/site/agent-visual.tsx`
- `src/components/site/tech-marquee.tsx`
- `src/app/globals.css`

## Implementation Requirements

- CSS-only animations respecting prefers-reduced-motion
- content-visibility lazy rendering below the fold
- No fabricated stats

## Acceptance Criteria

- [x] Lint/typecheck/build pass; E2E public + responsive + a11y pass

## Verification

- E2E
- Screenshots

## Status

**COMPLETED**

Verified: lint, typecheck, 74 unit, 31 DB, 56/56 E2E, production build (see docs/FINAL_REPORT.md).
