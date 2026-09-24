# 041 — Video performance

## Objective

Click-to-load facades and preload=none so video never affects initial load.

## Why This Matters

Iframes and video bytes are the largest LCP/INP risks.

## Dependencies

[040-video-management](040-video-management.md)

## Files Expected To Change

- `src/components/site/video-embed.tsx`

## Implementation Requirements

- Poster + play button; iframe injected on click
- Self-hosted video preload=none with poster
- Accessible play button label

## Acceptance Criteria

- [ ] No iframe in initial HTML (E2E)

## Verification

- tests/e2e/public.spec.ts

## Status

**PLANNED**
