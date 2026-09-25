"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Branded loading overlay during client-side navigations.
 *
 * Deliberately NOT a route-level loading.tsx: a Suspense boundary above pages
 * that call notFound() makes Next.js stream a 200 status ("soft 404"), which is
 * bad for SEO. This overlay appears only when a navigation takes > 250 ms.
 */
export function NavigationLoader({ siteName, logoUrl }: { siteName: string; logoUrl: string | null }) {
  const pathname = usePathname();
  const search = useSearchParams();
  const [pending, setPending] = useState(false);
  const [visible, setVisible] = useState(false);

  // Navigation finished → hide.
  useEffect(() => {
    const t = setTimeout(() => {
      setPending(false);
      setVisible(false);
    }, 0);
    return () => clearTimeout(t);
  }, [pathname, search]);

  // Start on internal link clicks.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a");
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.search === location.search) return;
      setPending(true);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  useEffect(() => {
    if (!pending) return;
    const t = setTimeout(() => setVisible(true), 250);
    return () => clearTimeout(t);
  }, [pending]);

  if (!visible) return null;
  const initial = siteName.replace(/^AI\s+with\s+/i, "").charAt(0).toUpperCase() || "A";
  return (
    <div role="status" aria-live="polite" className="fixed inset-0 z-[60] grid place-items-center bg-bg/85 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-5">
        <div className="relative grid size-20 place-items-center">
          <span aria-hidden className="absolute inset-0 rounded-3xl border border-accent/30 motion-safe:animate-ping [animation-duration:1.8s]" />
          <span aria-hidden className="absolute inset-0 rounded-3xl bg-linear-to-br from-accent/25 to-accent-2/10 blur-xl" />
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- tiny logo, already cached
            <img src={logoUrl} alt="" width={64} height={64} className="relative size-16 rounded-2xl object-contain" />
          ) : (
            <span className="relative grid size-16 place-items-center rounded-2xl border border-accent/40 bg-accent-soft font-mono text-2xl font-semibold text-accent shadow-glow">{initial}</span>
          )}
        </div>
        <p className="font-display text-lg font-semibold tracking-tight text-fg">{siteName}</p>
        <div aria-hidden className="h-1 w-40 overflow-hidden rounded-full bg-surface-3">
          <div className="h-full w-1/3 rounded-full bg-linear-to-r from-accent to-accent-2 motion-safe:animate-[loader_1.1s_ease-in-out_infinite]" />
        </div>
        <span className="sr-only">Loading…</span>
      </div>
    </div>
  );
}
