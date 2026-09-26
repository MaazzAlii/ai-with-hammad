"use client";

import {
  Activity,
  Briefcase,
  Building2,
  HelpCircle,
  MessagesSquare,
  Quote,
  FileText,
  FolderKanban,
  Handshake,
  Image as ImageIcon,
  Inbox,
  LayoutDashboard,
  Link2,
  Menu,
  PlaySquare,
  ScrollText,
  Settings,
  Share2,
  Shield,
  Users,
  Waypoints,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/utils";

import type { AdminNavItem } from "./nav";

const ICONS: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  projects: FolderKanban,
  services: Briefcase,
  team: Users,
  content: PlaySquare,
  social: Share2,
  sponsorship: Handshake,
  media: ImageIcon,
  inquiries: Inbox,
  settings: Settings,
  navigation: Waypoints,
  legal: FileText,
  users: Shield,
  audit: ScrollText,
  messages: MessagesSquare,
  clients: Building2,
  testimonials: Quote,
  faqs: HelpCircle,
  links: Link2,
  status: Activity,
};

export function AdminSidebar({ groups, user, newInquiries, unreadMessages = 0 }: { groups: { group: string; items: AdminNavItem[] }[]; user: { email: string; role: string }; newInquiries: number; unreadMessages?: number }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const count = (n: number, label: string) => (
    <span className="min-w-5 rounded-full bg-accent px-1.5 py-0.5 text-center text-[0.6875rem] font-semibold text-accent-fg tabular-nums">
      {n}
      <span className="sr-only"> {label}</span>
    </span>
  );
  const nav = (
    <nav aria-label="Admin" className="flex-1 space-y-6 overflow-y-auto overscroll-contain px-3 py-4">
      {groups.map((g) => (
        <div key={g.group}>
          <p className="label-caps mb-1.5 px-3">{g.group}</p>
          <ul className="space-y-0.5">
            {g.items.map((item) => {
              const Icon = ICONS[item.icon] ?? LayoutDashboard;
              const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "pressable flex min-h-10 items-center gap-3 rounded-[0.8rem] px-3 text-sm",
                      active ? "bg-accent font-medium text-accent-fg shadow-card" : "text-muted hover:bg-fg/[0.05] hover:text-fg",
                    )}
                  >
                    <Icon aria-hidden className="size-4" strokeWidth={active ? 2 : 1.75} />
                    <span className="flex-1">{item.label}</span>
                    {item.href === "/admin/messages" && unreadMessages > 0 ? count(unreadMessages, "unread") : null}
                    {item.href === "/admin/inquiries" && newInquiries > 0 ? count(newInquiries, "new") : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
  const footer = (
    <div className="border-t border-(--glass-line) p-4">
      <div className="flex items-center gap-3">
        <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-full bg-accent-soft text-sm font-semibold text-accent uppercase">
          {user.email.charAt(0)}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium text-fg">{user.email}</span>
          <span className="block text-xs text-subtle capitalize">{user.role}</span>
        </span>
      </div>
      <div className="mt-3 flex gap-2">
        <Link href="/" className={buttonVariants({ variant: "secondary", size: "sm", className: "flex-1" })} target="_blank">
          View site
        </Link>
        <ThemeToggle className="size-9 shrink-0" />
        <form action="/auth/signout" method="post" className="flex-1">
          <button type="submit" className={buttonVariants({ variant: "ghost", size: "sm", className: "w-full" })}>
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
  return (
    <>
      <div className="sticky top-0 z-30 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] lg:hidden">
        <div className="glass-chrome flex h-(--header-h) items-center justify-between rounded-full pr-1.5 pl-5">
          <span className="text-sm font-semibold tracking-tight">Admin</span>
          <span className="flex-1" />
          <ThemeToggle />
          <button type="button" onClick={() => setOpen(true)} className={buttonVariants({ variant: "ghost", size: "icon" })} aria-label="Open admin menu" aria-expanded={open}>
            <Menu className="size-5" />
          </button>
        </div>
      </div>
      {open ? <div className="anim-overlay fixed inset-0 z-40 bg-(--scrim) backdrop-blur-[6px] lg:hidden" data-state="open" onClick={() => setOpen(false)} aria-hidden /> : null}
      <aside
        className={cn(
          "glass-sheet fixed inset-y-2 left-2 z-50 flex w-72 flex-col rounded-[1.75rem] transition-transform duration-(--duration-slow) ease-spring",
          "lg:glass-chrome lg:sticky lg:top-3 lg:m-3 lg:h-[calc(100dvh-1.5rem)] lg:w-64 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-[calc(100%+1rem)]",
        )}
      >
        <div className="flex h-16 items-center justify-between px-5">
          <Link href="/admin" className="text-[0.9375rem] font-semibold tracking-tight">
            AI With Hamad <span className="font-normal text-subtle">· CMS</span>
          </Link>
          <button type="button" onClick={() => setOpen(false)} className={buttonVariants({ variant: "ghost", size: "icon", className: "size-9 lg:hidden" })} aria-label="Close admin menu">
            <X className="size-4" />
          </button>
        </div>
        {nav}
        {footer}
      </aside>
    </>
  );
}
