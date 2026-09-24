import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/page-header";
import { Alert } from "@/components/ui/misc";
import { formatBytes, formatDate } from "@/lib/utils";
import { can, requireStaff } from "@/server/auth/session";
import { dashboardStats, recentActivity, recentInquiries } from "@/server/dal/admin/dashboard";

export const metadata = { title: "Dashboard" };

function Stat({ label, value, sub, href }: { label: string; value: number | string; sub?: string; href?: string }) {
  const body = (
    <>
      <p className="text-xs tracking-wide text-subtle uppercase">{label}</p>
      <p className="mt-2 font-mono text-3xl text-fg">{value}</p>
      {sub ? <p className="mt-1 text-xs text-muted">{sub}</p> : null}
    </>
  );
  return href ? (
    <Link href={href} className="rounded-card border border-border bg-surface/60 p-5 transition-colors hover:border-accent/40">{body}</Link>
  ) : (
    <div className="rounded-card border border-border bg-surface/60 p-5">{body}</div>
  );
}

export default async function DashboardPage(props: PageProps<"/admin">) {
  const staff = await requireStaff();
  const sp = await props.searchParams;
  const [stats, inquiries, activity] = await Promise.all([
    dashboardStats(),
    can(staff, "inquiries.read") ? recentInquiries() : Promise.resolve([]),
    can(staff, "audit.read") ? recentActivity() : Promise.resolve([]),
  ]);
  const newCount = [...stats.inquiries.contact, ...stats.inquiries.sponsorship].filter((r) => r.status === "new").reduce((n, r) => n + r.n, 0);
  const openCount = [...stats.inquiries.contact, ...stats.inquiries.sponsorship].filter((r) => ["new", "contacted", "qualified", "proposal"].includes(r.status)).reduce((n, r) => n + r.n, 0);
  const mediaCount = stats.media.reduce((n, m) => n + m.count, 0);
  const mediaBytes = stats.media.reduce((n, m) => n + m.bytes, 0);
  const c = stats.content;
  return (
    <>
      <AdminPageHeader title={`Welcome${staff.fullName ? `, ${staff.fullName.split(" ")[0]}` : ""}`} description="Live counts from the database." />
      {sp.denied ? <Alert tone="warning" className="mb-6">You don&apos;t have permission to open that page.</Alert> : null}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {can(staff, "inquiries.read") ? <Stat label="New inquiries" value={newCount} sub={`${openCount} open in pipeline`} href="/admin/inquiries?status=new" /> : null}
        <Stat label="Projects" value={c.projects.published} sub={`${c.projects.drafts} draft${c.projects.drafts === 1 ? "" : "s"}`} href="/admin/projects" />
        <Stat label="Content items" value={c.content.published} sub={`${c.content.drafts} draft${c.content.drafts === 1 ? "" : "s"}`} href="/admin/content" />
        <Stat label="Services" value={c.services.published} sub={`${c.services.drafts} draft${c.services.drafts === 1 ? "" : "s"}`} href="/admin/services" />
        <Stat label="Team members" value={c.team.published} sub={`${c.team.drafts} draft${c.team.drafts === 1 ? "" : "s"}`} href="/admin/team" />
        <Stat label="Media files" value={mediaCount} sub={formatBytes(mediaBytes)} href="/admin/media" />
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {can(staff, "inquiries.read") ? (
          <section className="rounded-card border border-border bg-surface/60 p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Latest inquiries</h2>
              <Link href="/admin/inquiries" className="text-sm text-accent hover:underline">All</Link>
            </div>
            {inquiries.length ? (
              <ul className="mt-4 divide-y divide-border">
                {inquiries.map((i) => (
                  <li key={i.id}>
                    <Link href={`/admin/inquiries/${i.kind}/${i.id}`} className="flex items-center justify-between gap-3 py-3 hover:text-accent">
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{i.name}{i.company ? ` · ${i.company}` : ""}</span>
                        <span className="text-xs text-subtle capitalize">{i.kind} · {formatDate(i.createdAt)}</span>
                      </span>
                      <span className="shrink-0 rounded-full border border-border-strong px-2 py-0.5 text-xs capitalize">{i.status}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : <p className="mt-4 text-sm text-muted">No inquiries yet.</p>}
          </section>
        ) : null}
        {can(staff, "audit.read") ? (
          <section className="rounded-card border border-border bg-surface/60 p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Recent activity</h2>
              <Link href="/admin/audit" className="text-sm text-accent hover:underline">Audit log</Link>
            </div>
            {activity.length ? (
              <ul className="mt-4 space-y-3 text-sm">
                {activity.map((a) => (
                  <li key={a.id} className="flex justify-between gap-3">
                    <span className="min-w-0 truncate">{a.summary || a.action}<span className="block text-xs text-subtle">{a.actorEmail || "system"}</span></span>
                    <time className="shrink-0 text-xs text-subtle" dateTime={a.createdAt.toISOString()}>{formatDate(a.createdAt)}</time>
                  </li>
                ))}
              </ul>
            ) : <p className="mt-4 text-sm text-muted">No activity yet.</p>}
          </section>
        ) : null}
      </div>
    </>
  );
}
