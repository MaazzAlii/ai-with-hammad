# 072 — Form security

## Objective

Honeypot, min fill time, DB rate limit, length limits, email normalization.

## Why This Matters

Quality attributes determine whether the platform is production-ready rather than a prototype.

## Dependencies

[055-inquiry-system](055-inquiry-system.md)

## Files Expected To Change

- `src/lib/rate-limit.ts`
- `src/lib/validation/inquiry.ts`

## Implementation Requirements

- Implement per research findings
- Add automated check where feasible

## Acceptance Criteria

- [ ] Checks pass

## Verification

- See tests listed in files

## Status

**PLANNED**
