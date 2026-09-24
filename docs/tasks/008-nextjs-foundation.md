# 008 — Next.js foundation

## Objective

Scaffold Next.js 16 (App Router, TS, Tailwind v4, ESLint) with scripts for lint/typecheck/test/build.

## Why This Matters

Every other task builds on this foundation.

## Dependencies

[003-architecture-definition](003-architecture-definition.md)

## Files Expected To Change

- `package.json`
- `tsconfig.json`
- `next.config.ts`
- `eslint.config.mjs`
- `postcss.config.mjs`
- `src/app/*`

## Implementation Requirements

- Pin versions; Node >= 20.9
- Scripts: dev, build, start, lint, typecheck, test, test:e2e
- Security headers + image remotePatterns in next.config.ts
- components.json for shadcn

## Acceptance Criteria

- [ ] `npm run lint`, `npm run typecheck`, `npm run build` pass

## Verification

- Run the scripts

## Status

**PLANNED**
