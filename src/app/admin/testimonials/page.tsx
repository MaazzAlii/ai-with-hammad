import { desc, eq, isNull } from "drizzle-orm";
import { Plus } from "lucide-react";
import Link from "next/link";

import { ActionButton } from "@/components/admin/confirm-action";
import { FlagToggle } from "@/components/admin/flag-toggle";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Stars } from "@/components/portal/star-rating";
import { EmptyState } from "@/components/site/section";
import { buttonVariants } from "@/components/ui/button";
import { getDb } from "@/db";
import { clients, testimonials } from "@/db/schema";
import { cn, formatDate } from "@/lib/utils";
import { setTestimonialPublished, setTestimonialStatus } from "@/server/actions/testimonials";
import { can, requirePagePermission } from "@/server/auth/session";
import { averageRating } from "@/server/dal/public/testimonials";


export const metadata = { title: "Testimonials" };

const STATUS_CLASS = { pending: "border-warning/30 text-warning", approved: "border-success/30 text-success", rejected: "border-danger/30 text-danger" } as const;

export default async function TestimonialsAdminPage(props: PageProps<"/admin/testimonials">) {
  const staff = await requirePagePermission("cms.read");
  const sp = await props.searchParams;
  const filter = sp.status === "pending" || sp.status === "approved" || sp.status === "rejected" ? sp.status : undefined;
  const rows = await getDb()
    .select({ t: testimonials, clientName: clients.companyName })
    .from(testimonials)
    .leftJoin(clients, eq(clients.id, testimonials.clientId))
    .where(isNull(testimonials.deletedAt))
    .orderBy(desc(testimonials.createdAt));
  const list = filter ? rows.filter((r) => r.t.status === filter) : rows;
  const canModerate = can(staff, "testimonials.moderate");
  const avg = averageRating(rows.filter((r) => r.t.isPublished).map((r) => r.t));
  return (
    <>
      <AdminPageHeader
        title="Testimonials"
        description={`Client feedback from the portal plus testimonials you add manually. ${avg ? `Published average: ${avg}★.` : ""}`}
        actions={canModerate ? <Link href="/admin/testimonials/new" className={buttonVariants()}><Plus /> Add testimonial</Link> : null}
      />
      <nav aria-label="Filter" className="mb-6 flex flex-wrap gap-2">
        {[["All", undefined], ["Pending", "pending"], ["Approved", "approved"], ["Rejected", "rejected"]].map(([label, value]) => (
          <Link key={label} href={value ? `/admin/testimonials?status=${value}` : "/admin/testimonials"} className={cn("rounded-full border px-3 py-1.5 text-sm", filter === value ? "border-accent bg-accent-soft text-accent" : "border-border-strong text-muted hover:text-fg")}>
            {label} <span className="text-subtle">{value ? rows.filter((r) => r.t.status === value).length : rows.length}</span>
          </Link>
        ))}
      </nav>
      {list.length ? (
        <ul className="space-y-3">
          {list.map(({ t, clientName }) => (
            <li key={t.id} className="glass-card rounded-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Stars rating={t.rating} />
                  <p className="mt-1 text-sm font-medium">{t.authorName}{t.authorTitle ? `, ${t.authorTitle}` : ""}{t.company ? ` · ${t.company}` : ""}</p>
                  <p className="text-xs text-subtle">{t.source === "portal" ? `Portal${clientName ? ` · ${clientName}` : ""}` : "Added manually"} · {formatDate(t.createdAt)} · {t.consentToPublish ? "consent given" : "private feedback (no consent)"}</p>
                </div>
                <span className={cn("rounded-full border px-2 py-0.5 text-xs capitalize", STATUS_CLASS[t.status])}>{t.status}</span>
              </div>
              <blockquote className="mt-3 text-sm whitespace-pre-wrap text-muted">“{t.quote}”</blockquote>
              {canModerate ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {t.status !== "approved" ? (
                    <ActionButton size="sm" variant="secondary" action={async () => { "use server"; return setTestimonialStatus(t.id, "approved"); }}>Approve</ActionButton>
                  ) : null}
                  {t.status !== "rejected" ? (
                    <ActionButton size="sm" variant="ghost" action={async () => { "use server"; return setTestimonialStatus(t.id, "rejected"); }}>Reject</ActionButton>
                  ) : null}
                  {t.status === "approved" && t.consentToPublish ? (
                    <ActionButton size="sm" variant={t.isPublished ? "ghost" : "primary"} action={async () => { "use server"; return setTestimonialPublished(t.id, !t.isPublished); }}>
                      {t.isPublished ? "Unpublish" : "Publish on website"}
                    </ActionButton>
                  ) : null}
                  {t.isPublished ? <FlagToggle entity="testimonials" id={t.id} flag="isFeatured" value={t.isFeatured} label="Featured" /> : null}
                  {t.source === "manual" ? <Link href={`/admin/testimonials/${t.id}`} className={buttonVariants({ size: "sm", variant: "ghost" })}>Edit</Link> : null}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      ) : <EmptyState title="No testimonials here yet" />}
    </>
  );
}
