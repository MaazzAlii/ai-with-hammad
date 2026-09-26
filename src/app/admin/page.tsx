import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/misc";
import { formatBytes, formatDate } from "@/lib/utils";
import { can, requireStaff } from "@/server/auth/session";
import { dashboardStats, pendingTestimonialCount, recentActivity, recentInquiries } from "@/server/dal/admin/dashboard";
import { unreadThreadCount } from "@/server/dal/portal";
import { settle } from "@/server/with-timeout";

export const metadata = { title: "Dashboard" };

const ZERO = { published: 0, drafts: 0 };

function Stat({ label, value, sub, href }: { label: string; value: number | string; sub?: string; href?: string }) {
  const body = (
    <>
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 text-[2rem] leading-none font-semibold tracking-tight text-fg tabular-nums">{value}</p>
      {sub ? <p className="mt-2 text-xs text-subtle">{sub}</p> : null}
    </>
  );
  return href ? (
    <Link href={href} className="glass-card lift rounded-card p-5">{body}</Link>
  ) : (
    <div className="glass-card rounded-card p-5">{body}</div>
  );
}

export default async function DashboardPage(props: PageProps<"/admin">) {
  const staff = await requireStaff();
  const sp = await props.searchParams;
  // Each widget settles on its own with a time limit: one slow or failing query can
  // never leave the whole dashboard stuck on its loading skeleton.
  const emptyStats: Awaited<ReturnType<typeof dashboardStats>> = {
    content: { projects: ZERO, services: ZERO, team: ZERO, content: ZERO },
    inquiries: { contact: [], sponsorship: [] },
    media: [],
  };
  const results = await Promise.all([
    settle(dashboardStats(), emptyStats, "Content & media counts"),
    settle(can(staff, "inquiries.read") ? recentInquiries() : Promise.resolve([]), [], "Latest inquiries"),
    settle(can(staff, "audit.read") ? recentActivity() : Promise.resolve([]), [], "Recent activity"),
    settle(can(staff, "messages.read") ? unreadThreadCount() : Promise.resolve(0), 0, "Unread messages"),
    settle(pendingTestimonialCount(), 0, "Testimonials to review"),
  ]);
  const [stats, inquiries, activity, unread, pendingReviews] = [results[0].value, results[1].value, results[2].value, results[3].value, results[4].value];
  const failures = results.flatMap((r) => (r.error ? [r.error] : []));
  const newCount = [...stats.inquiries.contact, ...stats.inquiries.sponsorship].filter((r) => r.status === "new").reduce((n, r) => n + r.n, 0);
  const openCount = [...stats.inquiries.contact, ...stats.inquiries.sponsorship].filter((r) => ["new", "contacted", "qualified", "proposal"].includes(r.status)).reduce((n, r) => n + r.n, 0);
  const mediaCount = stats.media.reduce((n, m) => n + m.count, 0);
  const mediaBytes = stats.media.reduce((n, m) => n + m.bytes, 0);
  const c = stats.content;
  return (
    <>
      <AdminPageHeader title={`Welcome${staff.fullName ? `, ${staff.fullName.split(" ")[0]}` : ""}`} description="Live counts from the database." />
      {sp.denied ? <Alert tone="warning" className="mb-6">You don&apos;t have permission to open that page.</Alert> : null}
      {failures.length ? (
        <Alert tone="danger" className="mb-6">
          <p className="font-medium">Some numbers couldn&apos;t load right now.</p>
          <ul className="mt-1 list-disc pl-5 text-xs">
            {failures.map((f) => <li key={f}>{f}</li>)}
          </ul>
          {can(staff, "settings.write") ? <Link href="/admin/status" className="mt-2 inline-block text-xs font-medium underline">Open system status</Link> : null}
        </Alert>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {can(staff, "inquiries.read") ? <Stat label="New inquiries" value={newCount} sub={`${openCount} open in pipeline`} href="/admin/inquiries?status=new" /> : null}
        {can(staff, "messages.read") ? <Stat label="Unread client messages" value={unread} href="/admin/messages?unread=1" /> : null}
        <Stat label="Testimonials to review" value={pendingReviews} href="/admin/testimonials?status=pending" />
        <Stat label="Projects" value={c.projects.published} sub={`${c.projects.drafts} draft${c.projects.drafts === 1 ? "" : "s"}`} href="/admin/projects" />
        <Stat label="Content items" value={c.content.published} sub={`${c.content.drafts} draft${c.content.drafts === 1 ? "" : "s"}`} href="/admin/content" />
        <Stat label="Services" value={c.services.published} sub={`${c.services.drafts} draft${c.services.drafts === 1 ? "" : "s"}`} href="/admin/services" />
        <Stat label="Team members" value={c.team.published} sub={`${c.team.drafts} draft${c.team.drafts === 1 ? "" : "s"}`} href="/admin/team" />
        <Stat label="Media files" value={mediaCount} sub={formatBytes(mediaBytes)} href="/admin/media" />
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {can(staff, "inquiries.read") ? (
          <section className="glass-card rounded-card p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold tracking-tight">Latest inquiries</h2>
              <Link href="/admin/inquiries" className="text-sm text-accent hover:underline">All</Link>
            </div>
            {inquiries.length ? (
              <ul className="mt-4 divide-y divide-(--glass-line)">
                {inquiries.map((i) => (
                  <li key={i.id}>
                    <Link href={`/admin/inquiries/${i.kind}/${i.id}`} className="flex items-center justify-between gap-3 py-3 hover:text-accent">
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{i.name}{i.company ? ` · ${i.company}` : ""}</span>
                        <span className="text-xs text-subtle capitalize">{i.kind} · {formatDate(i.createdAt)}</span>
                      </span>
                      <Badge className="shrink-0 capitalize">{i.status}</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : <p className="mt-4 text-sm text-muted">No inquiries yet.</p>}
          </section>
        ) : null}
        {can(staff, "audit.read") ? (
          <section className="glass-card rounded-card p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold tracking-tight">Recent activity</h2>
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
