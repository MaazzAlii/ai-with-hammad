"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Spinner } from "@/components/ui/spinner";

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
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 top-[calc(var(--header-h)+max(0.75rem,env(safe-area-inset-top))+0.75rem)] z-[60] flex justify-center">
      <div className="glass-float flex items-center gap-2.5 rounded-full py-1.5 pr-4 pl-1.5 motion-safe:animate-[drop-in_320ms_var(--ease-spring)]">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- tiny logo, already cached
          <img src={logoUrl} alt="" width={28} height={28} className="size-7 rounded-[0.5rem] object-contain" />
        ) : (
          <span aria-hidden className="grid size-7 place-items-center rounded-[0.5rem] bg-accent text-xs font-semibold text-accent-fg">
            {monogram(siteName)}
          </span>
        )}
        <span className="text-sm font-medium text-fg">{siteName}</span>
        <Spinner className="text-muted" />
        <span className="sr-only">Loading…</span>
      </div>
    </div>
  );
}
