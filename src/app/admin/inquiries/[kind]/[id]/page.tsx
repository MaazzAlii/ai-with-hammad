import { Trash2 } from "lucide-react";
import { notFound } from "next/navigation";

import { AdminForm } from "@/components/admin/admin-form";
import { ActionButton } from "@/components/admin/confirm-action";
import { FormSection, SelectField, TextAreaField } from "@/components/admin/fields";
import { AdminPageHeader } from "@/components/admin/page-header";
import { inquiryPriority, inquiryStatus } from "@/db/schema";
import { formatDate } from "@/lib/utils";
import { addInquiryNote, deleteInquiry, updateInquiry } from "@/server/actions/inquiries";
import { can, requirePagePermission } from "@/server/auth/session";
import { assignableStaff, getInquiry } from "@/server/dal/admin/inquiries";
import { PLATFORM_LABELS } from "@/server/dal/public/content";

export const metadata = { title: "Inquiry" };

export default async function InquiryPage(props: PageProps<"/admin/inquiries/[kind]/[id]">) {
  const { kind, id } = await props.params;
  const staff = await requirePagePermission("inquiries.read");
  if ((kind !== "contact" && kind !== "sponsorship") || !/^[0-9a-f-]{36}$/.test(id)) notFound();
  const [data, people] = await Promise.all([getInquiry(kind, id), assignableStaff()]);
  if (!data) notFound();
  const r = data.row;
  const canWrite = can(staff, "inquiries.write");
  const fields: [string, string][] =
    data.kind === "contact"
      ? [["Email", r.email], ["Company", r.company], ["Phone", (r as { phone: string }).phone], ["Service", (r as { serviceLabel: string }).serviceLabel], ["Budget", (r as { budget: string }).budget], ["Timeline", r.timeline]]
      : [
          ["Email", r.email],
          ["Company", r.company],
          ["Website", (r as { website: string }).website],
          ["Package", data.packageName ?? ""],
          ["Platforms", ((r as { platforms: string[] }).platforms ?? []).map((p) => PLATFORM_LABELS[p as keyof typeof PLATFORM_LABELS] ?? p).join(", ")],
          ["Budget", (r as { budgetRange: string }).budgetRange],
          ["Timeline", r.timeline],
          ["Goals", (r as { campaignGoals: string }).campaignGoals],
        ];
  return (
    <>
      <AdminPageHeader
        title={r.name}
        description={`${kind === "contact" ? "Contact" : "Sponsorship"} inquiry · received ${formatDate(r.createdAt, { hour: "2-digit", minute: "2-digit" })} · email notification: ${r.emailStatus}`}
        breadcrumbs={[{ href: "/admin/inquiries", label: "Inquiries" }]}
        actions={
          can(staff, "inquiries.delete") ? (
            <ActionButton
              variant="ghost"
              size="sm"
              redirectTo="/admin/inquiries"
              action={async () => {
                "use server";
                return deleteInquiry(kind, id);
              }}
              confirm={{ title: "Delete inquiry?", description: "This permanently deletes the inquiry and its notes.", confirmLabel: "Delete" }}
            >
              <Trash2 /> Delete
            </ActionButton>
          ) : null
        }
      />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-6">
          <section className="rounded-card border border-border bg-surface/60 p-5 sm:p-6">
            <dl className="grid gap-4 sm:grid-cols-2">
              {fields.filter(([, v]) => v).map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs tracking-wide text-subtle uppercase">{k}</dt>
                  <dd className="mt-0.5 break-words">{k === "Email" ? <a href={`mailto:${v}`} className="text-accent hover:underline">{v}</a> : v}</dd>
                </div>
              ))}
            </dl>
            <h2 className="mt-6 text-xs tracking-wide text-subtle uppercase">Message</h2>
            {/* Rendered as plain text: React escapes it; whitespace preserved. */}
            <p className="mt-1 whitespace-pre-wrap break-words">{r.message}</p>
          </section>
          <section>
            <h2 className="mb-3 font-semibold">Notes</h2>
            {data.notes.length ? (
              <ul className="mb-4 space-y-3">
                {data.notes.map((n) => (
                  <li key={n.id} className="rounded-card border border-border bg-surface/60 p-4">
                    <p className="whitespace-pre-wrap text-sm">{n.body}</p>
                    <p className="mt-2 text-xs text-subtle">{n.authorName || n.authorEmail || "Former user"} · {formatDate(n.createdAt, { hour: "2-digit", minute: "2-digit" })}</p>
                  </li>
                ))}
              </ul>
            ) : <p className="mb-4 text-sm text-muted">No notes yet.</p>}
            {canWrite ? (
              <AdminForm action={addInquiryNote.bind(null, kind, id)} submitLabel="Add note" compact>
                <TextAreaField name="body" label="New note" rows={3} />
              </AdminForm>
            ) : null}
          </section>
        </div>
        <div>
          <AdminForm action={updateInquiry.bind(null, kind, id)} disabled={!canWrite} submitLabel="Update" compact>
            <FormSection title="Pipeline">
              <SelectField name="status" label="Status" defaultValue={r.status} options={inquiryStatus.enumValues.map((s) => ({ value: s, label: s[0]!.toUpperCase() + s.slice(1) }))} />
              <SelectField name="priority" label="Priority" defaultValue={r.priority} options={inquiryPriority.enumValues.map((s) => ({ value: s, label: s[0]!.toUpperCase() + s.slice(1) }))} />
              <SelectField name="assignedTo" label="Assigned to" defaultValue={r.assignedTo ?? ""} options={[{ value: "", label: "Unassigned" }, ...people.map((p) => ({ value: p.id, label: p.fullName || p.email }))]} />
              <dl className="space-y-1 text-xs text-subtle">
                <div>First contacted: {r.contactedAt ? formatDate(r.contactedAt) : "—"}</div>
                <div>Closed: {r.closedAt ? formatDate(r.closedAt) : "—"}</div>
                <div>Updated: {formatDate(r.updatedAt)}</div>
              </dl>
            </FormSection>
          </AdminForm>
        </div>
      </div>
    </>
  );
}
