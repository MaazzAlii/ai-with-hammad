"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * The floating capsule. At the top of the page it sits lightly on the canvas;
 * once content scrolls beneath it, the glass thickens and the shadow deepens.
 */
export function HeaderShell({ children }: { children: React.ReactNode }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="no-print pointer-events-none fixed inset-x-0 top-0 z-40 pt-[max(0.75rem,env(safe-area-inset-top))]">
      <div className="container-page">
        <div
          data-scrolled={scrolled ? "" : undefined}
          className={cn(
            "pointer-events-auto mx-auto flex h-(--header-h) max-w-5xl items-center justify-between gap-3 rounded-full pr-2 pl-2",
            "glass-chrome transition-[background-color,box-shadow,max-width,translate] duration-(--duration-slow) ease-spring",
            "not-data-scrolled:bg-(--glass-soft) not-data-scrolled:shadow-[inset_0_1px_0_var(--glass-edge)]",
            "data-scrolled:max-w-[60rem]",
          )}
        >
          {children}
        </div>
      </div>
    </header>
  );
}
