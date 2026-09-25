"use client";

import {
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
};

export function AdminSidebar({ groups, user, newInquiries, unreadMessages = 0 }: { groups: { group: string; items: AdminNavItem[] }[]; user: { email: string; role: string }; newInquiries: number; unreadMessages?: number }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const nav = (
    <nav aria-label="Admin" className="flex-1 space-y-6 overflow-y-auto p-4">
      {groups.map((g) => (
        <div key={g.group}>
          <p className="mb-2 px-3 text-[0.68rem] font-semibold tracking-widest text-subtle uppercase">{g.group}</p>
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
                    className={cn("flex min-h-10 items-center gap-3 rounded-control px-3 text-sm transition-colors", active ? "bg-accent-soft text-accent" : "text-muted hover:bg-surface-2 hover:text-fg")}
                  >
                    <Icon aria-hidden className="size-4" />
                    <span className="flex-1">{item.label}</span>
                    {item.href === "/admin/messages" && unreadMessages > 0 ? (
                      <span className="rounded-full bg-accent px-2 py-0.5 text-[0.68rem] font-semibold text-accent-fg">{unreadMessages}<span className="sr-only"> unread</span></span>
                    ) : null}
                    {item.href === "/admin/inquiries" && newInquiries > 0 ? (
                      <span className="rounded-full bg-accent px-2 py-0.5 text-[0.68rem] font-semibold text-accent-fg">{newInquiries}<span className="sr-only"> new</span></span>
                    ) : null}
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
    <div className="border-t border-border p-4">
      <p className="truncate text-sm text-fg">{user.email}</p>
      <p className="text-xs text-subtle capitalize">{user.role}</p>
      <div className="mt-3 flex gap-2">
        <Link href="/" className="flex-1 rounded-control border border-border px-3 py-2 text-center text-xs text-muted hover:text-fg" target="_blank">View site</Link>
        <form action="/auth/signout" method="post" className="flex-1">
          <button type="submit" className="w-full rounded-control border border-border px-3 py-2 text-xs text-muted hover:text-fg">Sign out</button>
        </form>
      </div>
    </div>
  );
  return (
    <>
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-bg/90 px-4 backdrop-blur lg:hidden">
        <span className="font-display text-sm font-semibold">Admin</span>
        <button type="button" onClick={() => setOpen(true)} className="grid size-10 place-items-center rounded-control hover:bg-surface-2" aria-label="Open admin menu" aria-expanded={open}>
          <Menu className="size-5" />
        </button>
      </div>
      {open ? <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setOpen(false)} aria-hidden /> : null}
      <aside className={cn("fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-surface transition-transform lg:sticky lg:top-0 lg:h-dvh lg:translate-x-0", open ? "translate-x-0" : "-translate-x-full")}>
        <div className="flex h-14 items-center justify-between border-b border-border px-5">
          <Link href="/admin" className="font-display text-sm font-semibold">AI With Hamad · CMS</Link>
          <button type="button" onClick={() => setOpen(false)} className="grid size-9 place-items-center rounded-control hover:bg-surface-2 lg:hidden" aria-label="Close admin menu"><X className="size-4" /></button>
        </div>
        {nav}
        {footer}
      </aside>
    </>
  );
}
