"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { monogram } from "./logo";

/**
 * Branded loading indicator during client-side navigations.
 *
 * Deliberately NOT a route-level loading.tsx: a Suspense boundary above pages
 * that call notFound() makes Next.js stream a 200 status ("soft 404"), which is
 * bad for SEO. A glass capsule drops in below the header only when a navigation
 * takes > 250 ms; the page stays visible and interactive underneath.
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
  return (
    <div role="status" aria-live="polite" className="fixed inset-0 z-[60] grid place-items-center bg-bg/40 backdrop-blur-[3px] motion-safe:animate-[fade-in_200ms_var(--ease-out-soft)]">
      <div className="glass-sheet flex w-56 flex-col items-center gap-4 rounded-[1.75rem] px-6 py-7 motion-safe:animate-[pop-in_320ms_var(--ease-spring)]">
        <span className="relative grid size-16 place-items-center">
          <span aria-hidden className="absolute inset-0 rounded-[1.1rem] bg-accent/25 blur-xl" />
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- tiny logo, already cached
            <img src={logoUrl} alt="" width={64} height={64} className="relative size-16 rounded-[1.1rem] object-contain" />
          ) : (
            <span aria-hidden className="relative grid size-16 place-items-center rounded-[1.1rem] bg-accent text-2xl font-semibold text-accent-fg shadow-[inset_0_1px_0_rgb(255_255_255/0.3)]">
              {monogram(siteName)}
            </span>
          )}
        </span>
        <p className="text-center text-[0.9375rem] font-semibold tracking-tight text-fg">{siteName}</p>
        <div aria-hidden className="h-1 w-28 overflow-hidden rounded-full bg-fg/10">
          <div className="h-full w-1/3 rounded-full bg-accent motion-safe:animate-[loader_1.1s_ease-in-out_infinite]" />
        </div>
        <span className="sr-only">Loading…</span>
      </div>
    </div>
  );
}
