"use client";

import { MessageSquarePlus, MessagesSquare, Star, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const ITEMS: { href: string; label: string; short: string; icon: LucideIcon }[] = [
  { href: "/portal", label: "Conversations", short: "Inbox", icon: MessagesSquare },
  { href: "/portal/messages/new", label: "New message", short: "New", icon: MessageSquarePlus },
  { href: "/portal/feedback", label: "Feedback", short: "Feedback", icon: Star },
];

function isActive(pathname: string, href: string) {
  if (href === "/portal") return pathname === "/portal" || (pathname.startsWith("/portal/messages/") && pathname !== "/portal/messages/new");
  return pathname === href;
}

/** iOS-style segmented control: in the header on tablet/desktop, under it on phones. */
export function PortalNav({ label = "Portal", className }: { label?: string; className?: string }) {
  const pathname = usePathname();
  return (
    <nav aria-label={label} className={cn("rounded-full bg-fg/[0.05] p-1", className)}>
      <ul className="flex items-center">
        {ITEMS.map((i) => {
          const active = isActive(pathname, i.href);
          return (
            <li key={i.href} className="flex-1">
              <Link
                href={i.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm whitespace-nowrap transition-[background-color,color,box-shadow] duration-(--duration-base) ease-spring",
                  active ? "bg-surface font-medium text-fg shadow-card dark:bg-white/10" : "text-muted hover:text-fg",
                )}
              >
                <i.icon aria-hidden className="size-4 sm:hidden" />
                <span className="sm:hidden">{i.short}</span>
                <span className="hidden sm:inline">{i.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
