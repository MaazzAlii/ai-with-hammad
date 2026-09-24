# 071 — Security hardening

## Objective

Headers/CSP, URL sanitization, server-only boundaries, error hygiene.

## Why This Matters

Quality attributes determine whether the platform is production-ready rather than a prototype.

## Dependencies

[016-rbac](016-rbac.md)

## Files Expected To Change

- `next.config.ts`
- `src/lib/url-safety.ts`

## Implementation Requirements

- Implement per research findings
- Add automated check where feasible

## Acceptance Criteria

- [x] Checks pass

## Verification

- See tests listed in files

## Status

**COMPLETED**

Verified: seo.spec.ts header checks; docs/SECURITY_AUDIT.md.
