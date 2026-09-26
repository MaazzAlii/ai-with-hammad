import { count, eq } from "drizzle-orm";
import type { Metadata } from "next";

import { ADMIN_NAV } from "@/components/admin/nav";
import { AdminSidebar } from "@/components/admin/sidebar";
import { getDb } from "@/db";
import { contactInquiries, sponsorshipInquiries } from "@/db/schema";
import { AppToaster } from "@/components/ui/app-toaster";
import { NOINDEX } from "@/lib/seo";
import { requireStaff } from "@/server/auth/session";
import { unreadThreadCount } from "@/server/dal/portal";
import { settle } from "@/server/with-timeout";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin" }, ...NOINDEX };

/** Signed-in, per-user screens: never prerender or cache (always fresh data, never a baked-in redirect). */
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const staff = await requireStaff();
  const groups = ADMIN_NAV.map((g) => ({ group: g.group, items: g.items.filter((i) => staff.permissions.has(i.permission)) })).filter((g) => g.items.length);
  // Sidebar badges are nice-to-have: never let them block or break an admin page.
  const newInquiriesCount = async () => {
    const db = getDb();
    const [[a], [b]] = await Promise.all([
      db.select({ n: count() }).from(contactInquiries).where(eq(contactInquiries.status, "new")),
      db.select({ n: count() }).from(sponsorshipInquiries).where(eq(sponsorshipInquiries.status, "new")),
    ]);
    return (a?.n ?? 0) + (b?.n ?? 0);
  };
  const [{ value: newInquiries }, { value: unreadMessages }] = await Promise.all([
    staff.permissions.has("inquiries.read") ? settle(newInquiriesCount(), 0, "Sidebar inquiries badge", 4000) : { value: 0 },
    staff.permissions.has("messages.read") ? settle(unreadThreadCount(), 0, "Sidebar messages badge", 4000) : { value: 0 },
  ]);
  return (
    <div className="min-h-dvh lg:flex">
      <AdminSidebar groups={groups} user={{ email: staff.email, role: staff.role }} newInquiries={newInquiries} unreadMessages={unreadMessages} />
      <main id="main" className="min-w-0 flex-1 px-4 py-8 sm:px-8 lg:py-10">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
      <AppToaster />
    </div>
  );
}
