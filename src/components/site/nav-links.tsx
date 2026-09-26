"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useLayoutEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import type { NavLink } from "@/server/dal/public/site";

import { navIcon } from "./nav-icons";

export function isActiveLink(pathname: string, l: NavLink) {
  if (l.external) return false;
  if (l.href === "/") return pathname === "/";
  return pathname === l.href || pathname.startsWith(`${l.href}/`);
}

/**
 * Desktop navigation: a segmented control whose selection pill glides between items.
 * Before hydration the active item draws its own pill, so there is no flash.
 */
export function NavLinks({ links }: { links: NavLink[] }) {
  const pathname = usePathname();
  const listRef = useRef<HTMLUListElement>(null);
  const [pill, setPill] = useState<{ x: number; w: number } | null>(null);
  const [ready, setReady] = useState(false);

  const measure = useCallback(() => {
    const list = listRef.current;
    const active = list?.querySelector<HTMLElement>('a[aria-current="page"]');
    if (!list || !active) return setPill(null);
    // Measure against the list itself (offsetLeft would be relative to the <li>, i.e. always 0).
    const l = list.getBoundingClientRect();
    const a = active.getBoundingClientRect();
    setPill({ x: a.left - l.left, w: a.width });
  }, []);

  useLayoutEffect(() => {
    measure();
    const id = requestAnimationFrame(() => setReady(true));
    const ro = new ResizeObserver(measure);
    if (listRef.current) ro.observe(listRef.current);
    return () => {
      cancelAnimationFrame(id);
      ro.disconnect();
    };
  }, [measure, pathname]);

  return (
    <ul ref={listRef} className="group/nav relative flex items-center" data-ready={ready ? "" : undefined}>
      <li aria-hidden className="contents">
        <span
          className={cn(
            "absolute top-0 left-0 h-full rounded-full bg-surface shadow-card ring-1 ring-(--glass-line) dark:bg-white/10",
            ready && "transition-[translate,width,opacity] duration-(--duration-slow) ease-spring",
            pill ? "opacity-100" : "opacity-0",
          )}
          style={{ translate: `${pill?.x ?? 0}px 0`, width: pill?.w ?? 0 }}
        />
      </li>
      {links.map((l) => {
        const active = isActiveLink(pathname, l);
        return (
          <li key={`${l.href}-${l.label}`} className="relative">
            <Link
              href={l.href}
              aria-current={active ? "page" : undefined}
              {...(l.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className={cn(
                "relative block rounded-full px-3.5 py-1.5 text-[0.875rem] transition-colors duration-(--duration-fast)",
                active ? "font-medium text-fg" : "text-muted hover:text-fg",
                active && "bg-surface shadow-card group-data-[ready]/nav:bg-transparent group-data-[ready]/nav:shadow-none dark:bg-white/10",
              )}
            >
              {l.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Grouped list used inside the mobile menu sheet (iOS "inset grouped" style). */
export function NavList({ links, onNavigate }: { links: NavLink[]; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <ul className="overflow-hidden rounded-card bg-surface/70 shadow-[inset_0_0_0_1px_var(--glass-line)]">
      {links.map((l) => {
        const active = isActiveLink(pathname, l);
        const Icon = navIcon(l.href);
        return (
          <li key={`${l.href}-${l.label}`} className="border-b border-(--glass-line) last:border-b-0">
            <Link
              href={l.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              {...(l.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="pressable flex min-h-13 items-center gap-3.5 px-4 text-[1rem] active:bg-fg/[0.05]"
            >
              <span className={cn("grid size-8 place-items-center rounded-[0.6rem]", active ? "bg-accent text-accent-fg" : "bg-fg/[0.06] text-muted")}>
                <Icon aria-hidden className="size-[1.05rem]" strokeWidth={1.75} />
              </span>
              <span className={cn("flex-1", active ? "font-medium text-fg" : "text-fg")}>{l.label}</span>
              <ChevronRight aria-hidden className="size-4 text-subtle" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
