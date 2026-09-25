/** URL helpers that only ever return http(s) URLs or safe internal paths. */

export function safeHttpUrl(value: string | null | undefined, { httpsOnly = false } = {}): string | null {
  if (!value) return null;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" && (httpsOnly || url.protocol !== "http:")) return null;
    if (url.username || url.password) return null;
    return url.toString();
  } catch {
    return null;
  }
}

/** Internal links must be a single-slash absolute path (blocks //evil.com and javascript:). */
export function safeInternalPath(value: string | null | undefined): string | null {
  if (!value) return null;
  const v = value.trim();
  if (!v.startsWith("/") || v.startsWith("//") || v.startsWith("/\\")) return null;
  if (/[\u0000-\u001f]/.test(v)) return null;
  return v;
}

/** Accepts either a safe internal path or an https URL. */
export function safeHref(value: string | null | undefined): string | null {
  return safeInternalPath(value) ?? safeHttpUrl(value, { httpsOnly: true });
}

/** Sanitize a post-login redirect target to an internal admin path. */
export function safeNextPath(value: string | null | undefined, fallback = "/admin"): string {
  const p = safeInternalPath(value);
  return p && (p === "/admin" || p.startsWith("/admin/")) ? p : fallback;
}
