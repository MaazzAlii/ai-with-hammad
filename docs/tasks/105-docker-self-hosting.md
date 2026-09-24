# 105 — Docker self-hosting (Contabo VPS)

## Objective

Standalone Docker image + Caddy reverse proxy for the planned VPS move.

## Why This Matters

The owners plan to leave Vercel's free tier in about 5–6 months.

## Dependencies

[093-vps-portability](093-vps-portability.md)

## Files Expected To Change

- `Dockerfile`
- `.dockerignore`
- `deploy/docker-compose.yml`
- `deploy/Caddyfile`
- `src/app/api/health/route.ts`
- `next.config.ts`

## Implementation Requirements

- BUILD_STANDALONE=1 enables output: standalone
- Caddy overwrites X-Forwarded-For (rate limits) and handles HTTPS
- Health check endpoint

## Acceptance Criteria

- [x] Standalone build produces server.js

## Verification

- `BUILD_STANDALONE=1 next build`

## Status

**COMPLETED**

`BUILD_STANDALONE=1 npx next build` produced `.next/standalone/server.js`. Docker itself could not be run in this sandbox; image build to be confirmed on the VPS.
