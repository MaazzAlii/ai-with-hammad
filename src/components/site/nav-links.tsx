"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import type { NavLink } from "@/server/dal/public/site";

export function NavLinks({ links, vertical = false, onNavigate }: { links: NavLink[]; vertical?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <ul className={cn("flex", vertical ? "flex-col gap-1" : "items-center gap-1")}>
      {links.map((l) => {
        const active = !l.external && (pathname === l.href || pathname.startsWith(`${l.href}/`));
        return (
          <li key={`${l.href}-${l.label}`}>
            <Link
              href={l.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              {...(l.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className={cn(
                "block rounded-control px-3 py-2 text-sm transition-colors",
                vertical && "py-3 text-base",
                active ? "text-fg" : "text-muted hover:text-fg",
                active && !vertical && "bg-surface-2",
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
