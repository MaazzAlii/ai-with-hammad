import { count, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { Toaster } from "sonner";

import { ADMIN_NAV } from "@/components/admin/nav";
import { AdminSidebar } from "@/components/admin/sidebar";
import { getDb } from "@/db";
import { contactInquiries, sponsorshipInquiries } from "@/db/schema";
import { NOINDEX } from "@/lib/seo";
import { requireStaff } from "@/server/auth/session";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin" }, ...NOINDEX };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const staff = await requireStaff();
  const groups = ADMIN_NAV.map((g) => ({ group: g.group, items: g.items.filter((i) => staff.permissions.has(i.permission)) })).filter((g) => g.items.length);
  let newInquiries = 0;
  if (staff.permissions.has("inquiries.read")) {
    const db = getDb();
    const [[a], [b]] = await Promise.all([
      db.select({ n: count() }).from(contactInquiries).where(eq(contactInquiries.status, "new")),
      db.select({ n: count() }).from(sponsorshipInquiries).where(eq(sponsorshipInquiries.status, "new")),
    ]);
    newInquiries = (a?.n ?? 0) + (b?.n ?? 0);
  }
  return (
    <div className="min-h-dvh lg:flex">
      <AdminSidebar groups={groups} user={{ email: staff.email, role: staff.role }} newInquiries={newInquiries} />
      <main id="main" className="min-w-0 flex-1 px-4 py-8 sm:px-8 lg:py-10">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
      <Toaster theme="dark" position="bottom-right" richColors closeButton />
    </div>
  );
}
