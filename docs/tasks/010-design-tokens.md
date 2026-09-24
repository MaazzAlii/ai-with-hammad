# 010 — Design tokens

## Objective

Implement colour, radius, spacing, shadow and typography tokens with Tailwind v4 @theme.

## Why This Matters

Tokens enforce consistent radius (media vs cards vs buttons) and contrast.

## Dependencies

[008-nextjs-foundation](008-nextjs-foundation.md), [009-brand-system](009-brand-system.md)

## Files Expected To Change

- `src/app/globals.css`
- `src/app/fonts.ts`

## Implementation Requirements

- Tokens: bg, surface, border, fg, muted, accent, danger, success
- Radius scale: sm (controls), md (buttons), lg (cards), xl (media)
- next/font for Sora/Manrope/JetBrains Mono
- Reduced-motion rules

## Acceptance Criteria

- [x] All components use tokens; body text contrast >= 4.5:1

## Verification

- Contrast computed in tests/unit/contrast.test.ts

## Status

**COMPLETED**

Verified by tests/unit/contrast.test.ts (11 token pairs ≥ 4.5:1).
