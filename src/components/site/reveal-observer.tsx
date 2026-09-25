"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Drives the `[data-reveal]` scroll-in transitions defined in globals.css.
 *
 * Progressive: content is visible until this runs. Elements already in view are
 * marked shown *before* html[data-reveal] is set, so nothing above the fold flashes.
 * Disabled entirely under prefers-reduced-motion.
 */
export function RevealObserver() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    const root = document.documentElement;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.setAttribute("data-shown", "");
          io.unobserve(e.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    const vh = window.innerHeight;
    for (const el of document.querySelectorAll<HTMLElement>("[data-reveal]:not([data-shown])")) {
      if (el.getBoundingClientRect().top < vh * 0.95) el.setAttribute("data-shown", "");
      else io.observe(el);
    }
    root.setAttribute("data-reveal", "");
    return () => io.disconnect();
  }, [pathname]);

  return null;
}
