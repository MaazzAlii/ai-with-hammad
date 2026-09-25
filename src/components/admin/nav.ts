import type { Permission } from "@/lib/permissions";

export type AdminNavItem = { href: string; label: string; icon: string; permission: Permission };

export const ADMIN_NAV: { group: string; items: AdminNavItem[] }[] = [
  { group: "Overview", items: [{ href: "/admin", label: "Dashboard", icon: "dashboard", permission: "cms.read" }] },
  {
    group: "Content",
    items: [
      { href: "/admin/projects", label: "Projects", icon: "projects", permission: "cms.read" },
      { href: "/admin/services", label: "Services", icon: "services", permission: "cms.read" },
      { href: "/admin/team", label: "Team", icon: "team", permission: "cms.read" },
      { href: "/admin/content", label: "Content", icon: "content", permission: "cms.read" },
      { href: "/admin/social", label: "Social platforms", icon: "social", permission: "cms.read" },
      { href: "/admin/testimonials", label: "Testimonials", icon: "testimonials", permission: "cms.read" },
      { href: "/admin/faqs", label: "FAQs", icon: "faqs", permission: "cms.read" },
      { href: "/admin/sponsorship", label: "Sponsorship", icon: "sponsorship", permission: "cms.read" },
      { href: "/admin/media", label: "Media library", icon: "media", permission: "cms.read" },
    ],
  },
  {
    group: "CRM",
    items: [
      { href: "/admin/messages", label: "Messages", icon: "messages", permission: "messages.read" },
      { href: "/admin/clients", label: "Clients", icon: "clients", permission: "clients.read" },
      { href: "/admin/inquiries", label: "Inquiries", icon: "inquiries", permission: "inquiries.read" },
    ],
  },
  {
    group: "Site",
    items: [
      { href: "/admin/settings", label: "Settings", icon: "settings", permission: "settings.write" },
      { href: "/admin/navigation", label: "Navigation", icon: "navigation", permission: "navigation.write" },
      { href: "/admin/legal", label: "Legal pages", icon: "legal", permission: "legal.write" },
    ],
  },
  {
    group: "Administration",
    items: [
      { href: "/admin/users", label: "Users", icon: "users", permission: "users.read" },
      { href: "/admin/audit", label: "Audit log", icon: "audit", permission: "audit.read" },
    ],
  },
];
