"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

/**
 * Subtle 3D tilt with a soft light reflection that follows the pointer — for photos and
 * media only (never text or controls). Capped at a few degrees, mouse/trackpad only, and
 * off entirely under prefers-reduced-motion, so it reads as depth rather than a gimmick.
 *
 * Cards make the whole card clickable with a link overlay that sits above the photo, so
 * the pointer is tracked on the nearest `[data-tilt-root]` ancestor (falling back to the
 * element itself) while only the photo tilts.
 */
export function Tilt({ children, className, max = 3 }: { children: React.ReactNode; className?: string; max?: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const root = el.closest<HTMLElement>("[data-tilt-root]") ?? el;
    let frame = 0;

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || !fine.matches || reduced.matches) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
        const y = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
        el.style.setProperty("--ry", `${((x - 0.5) * 2 * max).toFixed(2)}deg`);
        el.style.setProperty("--rx", `${((0.5 - y) * 2 * max).toFixed(2)}deg`);
        el.style.setProperty("--gx", `${(x * 100).toFixed(1)}%`);
        el.style.setProperty("--gy", `${(y * 100).toFixed(1)}%`);
        el.dataset.active = "";
      });
    };
    const onLeave = () => {
      cancelAnimationFrame(frame);
      el.style.setProperty("--rx", "0deg");
      el.style.setProperty("--ry", "0deg");
      delete el.dataset.active;
    };

    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(frame);
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
    };
  }, [max]);

  return (
    <div ref={ref} className={cn("tilt relative", className)}>
      {children}
      <span aria-hidden className="tilt-sheen" />
    </div>
  );
}
