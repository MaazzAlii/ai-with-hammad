---
name: security-engineering
description: Security review checklist and hardening patterns for actions, data exposure, uploads, XSS, CSRF, secrets and abuse.
---
# Security engineering

Run this checklist for every change touching data, auth or user input (full audit: `docs/SECURITY_AUDIT.md`).

1. **AuthN/AuthZ** — action wrapped in `runAction`, calls `authorize(perm)` first, bound ids pass `assertId`, publish-type fields ignored without `*.publish`.
2. **Data exposure** — public DAL selects explicit columns; never imports `sponsorshipPackageRates`; DTOs only. Search HTML output in E2E for sensitive markers.
3. **Input** — zod on the server; lengths bounded; URLs through `safeHttpUrl`/`safeHref`; embeds through `parseEmbed`.
4. **Output** — no new `dangerouslySetInnerHTML`; text rendered as text (`whitespace-pre-wrap`).
5. **Uploads** — `validateUpload` + bucket limits + storage policy + finalize verification.
6. **CSRF** — mutations are server actions (origin-checked by Next) or origin-checked POST route handlers. No GET mutations.
7. **Abuse** — public endpoints: honeypot, min fill time, `rateLimit()` per hashed IP and per email.
8. **Secrets** — only in server env; never in `NEXT_PUBLIC_*`, logs, audit metadata (scrubbed) or SQL.
9. **Headers** — CSP/frame-ancestors/nosniff/referrer policy in `next.config.ts`; extend `frame-src` only for allow-listed embed providers.
10. **Tests** — add an RLS/role/E2E test proving the restriction.
