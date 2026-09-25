import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/site/section";
import { Button } from "@/components/ui/button";
import { Input, NativeSelect } from "@/components/ui/input";
import { Table, Td, Th } from "@/components/ui/misc";
import { inquiryStatus, type InquiryStatus } from "@/db/schema";
import { cn, formatDate } from "@/lib/utils";
import { requirePagePermission } from "@/server/auth/session";
import { listInquiries, statusCounts, type InquiryKind } from "@/server/dal/admin/inquiries";

export const metadata = { title: "Inquiries" };

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
        <Link href={link({ status: undefined, page: undefined })} className={cn("rounded-full border px-3 py-1.5 text-sm", !status ? "border-accent bg-accent-soft text-accent" : "border-border-strong text-muted")}>All</Link>
        {inquiryStatus.enumValues.map((s) => (
          <Link key={s} href={link({ status: s, page: undefined })} className={cn("rounded-full border px-3 py-1.5 text-sm capitalize", status === s ? "border-accent bg-accent-soft text-accent" : "border-border-strong text-muted")}>
            {s} <span className="text-subtle">{counts.get(s) ?? 0}</span>
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
            <tr><Th>From</Th><Th>Type</Th><Th>Status</Th><Th>Priority</Th><Th>Received</Th></tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id} className="hover:bg-surface-2/50">
                <Td>
                  <Link href={`/admin/inquiries/${i.kind}/${i.id}`} className="font-medium hover:text-accent">{i.name}</Link>
                  <p className="text-xs text-subtle">{i.company || i.email}</p>
                </Td>
                <Td className="capitalize">{i.kind}</Td>
                <Td><span className="rounded-full border border-border-strong px-2 py-0.5 text-xs capitalize">{i.status}</span></Td>
                <Td className={cn("capitalize", PRIORITY_CLASS[i.priority])}>{i.priority}</Td>
                <Td className="whitespace-nowrap text-muted">{formatDate(i.createdAt)}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : <EmptyState title="No inquiries match" />}
      <div className="mt-4 flex justify-between">
        {page > 1 ? <Link href={link({ page: String(page - 1) })} className="text-sm text-accent">← Newer</Link> : <span />}
        {hasMore ? <Link href={link({ page: String(page + 1) })} className="text-sm text-accent">Older →</Link> : null}
      </div>
    </>
  );
}
