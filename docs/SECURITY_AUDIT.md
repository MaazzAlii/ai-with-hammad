# Security audit

_Date: 2026-09-24 · Scope: whole repository at the time of the final report · Method: code review
against the checklist below + automated evidence (unit, DB/RLS and E2E tests)._

| Area | Result | Evidence / notes |
| --- | --- | --- |
| **Auth bypass** | ✅ | `/admin/**` layout calls `requireStaff()` (server-verified `getUser()` + DB profile); proxy redirect is only a fast path. E2E `auth.spec.ts`: anonymous redirect, wrong password, inactive account, sign-out revokes sessions. |
| **RBAC bypass** | ✅ | Every server action: `runAction` → `authorize(permission)`; every admin page: `requirePagePermission`. Publish/feature/pin/order require `*.publish` and are ignored server-side for editors (E2E forges hidden inputs → stays draft). Roles/permissions only from DB. |
| **Client-controlled ids** | ✅ fixed | Bound action arguments are not encrypted by Next.js. Added `assertId()` to every id-taking action (`tests/unit/run-action.test.ts`). |
| **Privilege escalation** | ✅ | Users cannot update their own role (RLS test); admins cannot grant/modify `owner` (`canManageRole`, E2E); DB trigger prevents demoting/deactivating the last owner (DB test); self-demotion blocked in `updateUser`. |
| **Storage access** | ✅ | Bucket MIME/size limits; INSERT/UPDATE/DELETE policies require `media.*`; site-assets/SVG require `settings.write`; executable extensions blocked; no anon listing (`storage-policies.test.ts`, E2E direct upload by viewer → 403). |
| **Private data leakage** | ✅ | Public DAL returns DTOs with explicit columns; inquiries/profiles/audit/rates have no anon policy and anon privileges revoked (`rls.test.ts`). `private-documents` bucket private (signed URLs). |
| **Internal sponsorship rates** | ✅ | Separate table `sponsorship_package_rates`; public DAL never imports it; admin page loads rates only with `sponsorship.rates`; audit metadata redacts rate keys. E2E asserts `/sponsorship` and `/media-kit` HTML contain none of the values; editor page HTML contains none. |
| **File upload attacks** | ✅ | `validateUpload` (MIME allow-list, extension ⇄ MIME match, blocked + double extensions, size, dimensions, duration), server-generated object paths (no traversal), finalize verifies stored size/MIME and deletes mismatches, SVG only via `<img>`/unoptimized. |
| **HTML injection / XSS** | ✅ | React escaping; only two `dangerouslySetInnerHTML`: JSON-LD (escaped `<>&`, U+2028/9) and the Markdown renderer (escapes everything, fixed tag set, safe links) — both unit-tested with payloads. Inquiry messages render as text. |
| **Unsafe URLs** | ✅ | `safeHttpUrl`/`safeHref`/`safeInternalPath`/`safeNextPath`; DB CHECK constraints on URL columns; embeds derived from allow-listed providers only (no stored iframe HTML); open-redirect E2E. |
| **CSRF** | ✅ | Mutations are Server Actions (Next.js checks Origin vs Host) or the origin-checked POST `/auth/signout` (E2E 403 for foreign origin). Auth cookies `SameSite=Lax`. No GET mutations. |
| **Public API exposure** | ✅ | No custom API routes. Supabase Data API protected by RLS on all 30 tables; helper functions in unexposed `private` schema with `EXECUTE` revoked from anon/public. |
| **Secret exposure** | ✅ | Secrets only in server env read via `serverEnv()` in `server-only` modules; `.env*` git-ignored; no secrets in SQL/seed; audit metadata scrubbed; errors to users are generic (`runAction`). |
| **Service-role exposure** | ✅ | `createSupabaseAdminClient` is `server-only`, used after `authorize()` for invites, storage deletes, signed URLs, session revocation. |
| **SQL injection** | ✅ | Drizzle parameterised queries; `sql` templates use bound params; `ilike` input escaped; enum/uuid inputs validated by zod. |
| **Rate abuse / spam** | ✅ | DB-backed fixed-window limits (contact/sponsorship per hashed IP + per email; login per IP + email; password reset per IP), honeypot, minimum fill time, link-count heuristic; Supabase Auth has its own limits. |
| **Headers** | ✅ | CSP (`frame-ancestors 'none'`, `object-src 'none'`, frame-src allow-list, `form-action 'self'`), `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, COOP; `X-Powered-By` removed; HSTS provided by Vercel. E2E `seo.spec.ts`. |
| **Indexing of private areas** | ✅ | `/admin`, `/login`, `/portal`: `noindex` meta + `X-Robots-Tag` + robots disallow; previews fully noindexed. |
| **Client portal isolation** | ✅ | Clients are `profiles.kind='client'`; `getCurrentStaff` and SQL `has_permission` reject them, staff login refuses them. Portal DAL filters every query by the session's `client_id`; RLS mirrors it (`rls.test.ts`: client A cannot read client B's threads/messages/testimonials; clients cannot read inquiries). E2E `portal.spec.ts`. |
| **Exported server functions** | ✅ fixed | A non-action helper exported from a `"use server"` file was callable by anyone; moved to the DAL. `server-actions-guard.test.ts` now fails the build on any non-async export. |
| **Bots / credential stuffing** | ✅ | Captcha on contact, sponsorship, staff login, password reset and client login: HMAC-signed, 10-minute TTL, single-use nonce in `rate_limits`; optional Cloudflare Turnstile verified server-side. |
| **Founder records** | ✅ | `private.protect_locked_team_members` trigger blocks rename/re-slug/unlock/delete of locked founders even via SQL/API (DB test). |

## Residual risks / accepted trade-offs

1. **CSP allows `'unsafe-inline'` scripts.** Nonces would force dynamic rendering of every page (no ISR). Mitigated by the absence of any injection sink (see XSS row). Revisit if Next.js adds static-compatible hashes.
2. **Rate limiting trusts `X-Forwarded-For`.** Correct on Vercel (the edge overwrites it). On a VPS the reverse proxy must overwrite the header — `deploy/Caddyfile` does this.
3. **Server-side content sniffing of uploads is limited to size + declared MIME** (enforced by Storage bucket rules + finalize). Files are served by Supabase with their declared type and images go through the Next image optimizer; SVG is restricted to settings managers. Magic-byte verification could be added with a server-side check if untrusted uploaders are ever allowed.
4. **Image dimensions/duration are client-measured** (informational metadata only).
5. **The app's database connection bypasses RLS** (Drizzle as `postgres`). The data-access layer is the enforcement point; covered by E2E role tests. RLS protects the public Data API.
6. **Viewers can read drafts in the CMS** — by design (read-only role), but not inquiries, rates or audit logs.
7. `scripts/local/supabase-gateway.mjs` is test infrastructure and must never be deployed.

## Operational recommendations

- Enable MFA for owner/admin accounts in Supabase Auth.
- Custom SMTP with SPF/DKIM; rotate keys if ever exposed; restrict who can see Vercel env vars.
- Enable Supabase PITR/backups; keep migrations additive.
- Review the audit log periodically (Admin → Audit log).
