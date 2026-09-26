import { ChevronRight, Inbox } from "lucide-react";
import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/site/section";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input, NativeSelect } from "@/components/ui/input";
import { Table, Td, Th } from "@/components/ui/misc";
import { inquiryStatus, type InquiryStatus } from "@/db/schema";
import { cn, formatDate } from "@/lib/utils";
import { requirePagePermission } from "@/server/auth/session";
import { listInquiries, statusCounts, type InquiryKind } from "@/server/dal/admin/inquiries";

export const metadata = { title: "Inquiries" };

const pill = (active: boolean) =>
  cn(
    "pressable inline-flex min-h-9 items-center gap-1.5 rounded-full px-3.5 text-sm capitalize",
    active ? "bg-fg font-medium text-bg shadow-card" : "bg-fg/[0.05] text-muted hover:bg-fg/[0.08] hover:text-fg",
  );

const STATUS_BADGE: Record<string, "accent" | "warning" | "success" | "danger" | "default"> = {
  new: "accent",
  contacted: "warning",
  qualified: "warning",
  proposal: "warning",
  won: "success",
  lost: "danger",
  archived: "default",
};

const PRIORITY_CLASS: Record<string, string> = { urgent: "text-danger", high: "text-warning", normal: "text-muted", low: "text-subtle" };

export default async function InquiriesPage(props: PageProps<"/admin/inquiries">) {
  const staff = await requirePagePermission("inquiries.read");
  const sp = await props.searchParams;
  const status = (inquiryStatus.enumValues as readonly string[]).includes(String(sp.status)) ? (sp.status as InquiryStatus) : undefined;
  const kind = sp.kind === "contact" || sp.kind === "sponsorship" ? (sp.kind as InquiryKind) : undefined;
  const q = typeof sp.q === "string" ? sp.q.slice(0, 100) : undefined;
  const assigned = sp.assigned === "me" ? staff.id : undefined;
  const page = Math.max(1, Number(sp.page) || 1);
  const [{ items, hasMore }, counts] = await Promise.all([listInquiries({ status, kind, q, assigned, page }), statusCounts()]);
  const total = [...counts.values()].reduce((n, c) => n + c, 0);
  const link = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged = { status, kind, q, assigned: sp.assigned === "me" ? "me" : undefined, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    return `/admin/inquiries${p.size ? `?${p}` : ""}`;
  };
  return (
    <>
      <AdminPageHeader title="Inquiries" description="Contact and sponsorship inquiries. Stored before any email is sent." />
      <nav aria-label="Pipeline" className="mb-4 flex flex-wrap gap-2">
        <Link href={link({ status: undefined, page: undefined })} className={pill(!status)} aria-current={!status ? "page" : undefined}>
          All <span className="tabular-nums opacity-70">{total}</span>
        </Link>
        {inquiryStatus.enumValues.map((s) => (
          <Link key={s} href={link({ status: s, page: undefined })} className={pill(status === s)} aria-current={status === s ? "page" : undefined}>
            {s} <span className="tabular-nums opacity-70">{counts.get(s) ?? 0}</span>
          </Link>
        ))}
      </nav>
      <form className="mb-6 flex flex-col gap-2 sm:flex-row" role="search">
        {status ? <input type="hidden" name="status" value={status} /> : null}
        <Input name="q" defaultValue={q} placeholder="Search name, email or company" aria-label="Search inquiries" className="sm:max-w-xs" />
        <NativeSelect name="kind" defaultValue={kind ?? ""} aria-label="Inquiry type" className="sm:w-44">
          <option value="">All types</option>
          <option value="contact">Contact</option>
          <option value="sponsorship">Sponsorship</option>
        </NativeSelect>
        <NativeSelect name="assigned" defaultValue={sp.assigned === "me" ? "me" : ""} aria-label="Assignment" className="sm:w-44">
          <option value="">Anyone</option>
          <option value="me">Assigned to me</option>
        </NativeSelect>
        <Button type="submit" variant="secondary">Filter</Button>
      </form>
      {items.length ? (
        <Table>
          <thead>
            <tr><Th>From</Th><Th>Type</Th><Th>Status</Th><Th>Priority</Th><Th>Received</Th><Th className="text-right">Actions</Th></tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id} className="relative transition-colors hover:bg-fg/[0.03]">
                <Td>
                  {/* The name link covers the whole row, so any click opens the inquiry. */}
                  <Link href={`/admin/inquiries/${i.kind}/${i.id}`} className="font-medium after:absolute after:inset-0 hover:text-accent">{i.name}</Link>
                  <p className="text-xs text-subtle">{i.company || i.email}</p>
                </Td>
                <Td className="capitalize">{i.kind}</Td>
                <Td><Badge variant={STATUS_BADGE[i.status] ?? "default"} className="capitalize">{i.status}</Badge></Td>
                <Td className={cn("capitalize", PRIORITY_CLASS[i.priority])}>{i.priority}</Td>
                <Td className="whitespace-nowrap text-muted">{formatDate(i.createdAt)}</Td>
                <Td className="text-right">
                  <span className={buttonVariants({ variant: "secondary", size: "sm", className: "pointer-events-none" })}>
                    Open <ChevronRight aria-hidden />
                  </span>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <EmptyState title={status || kind || q ? "No inquiries match these filters" : "No inquiries yet"} icon={<Inbox />}>
          {status || kind || q ? <Link href="/admin/inquiries" className="font-medium text-accent hover:underline">Clear filters</Link> : "Messages from the contact and “For brands” forms appear here."}
        </EmptyState>
      )}
      <div className="mt-4 flex justify-between">
        {page > 1 ? <Link href={link({ page: String(page - 1) })} className="text-sm text-accent">← Newer</Link> : <span />}
        {hasMore ? <Link href={link({ page: String(page + 1) })} className="text-sm text-accent">Older →</Link> : null}
      </div>
    </>
  );
}
