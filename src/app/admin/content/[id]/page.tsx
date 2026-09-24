import { notFound } from "next/navigation";

import { AdminForm } from "@/components/admin/admin-form";
import { ContentForm } from "@/components/admin/content-form";
import { DeleteEntityButton } from "@/components/admin/delete-button";
import { FormSection, TextField } from "@/components/admin/fields";
import { AdminPageHeader, StatusBadges } from "@/components/admin/page-header";
import { Table, Td, Th } from "@/components/ui/misc";
import { formatDate } from "@/lib/utils";
import { addContentMetrics, updateContentItem } from "@/server/actions/content";
import { can, requirePagePermission } from "@/server/auth/session";
import { getContentForEdit, listSocialAdmin } from "@/server/dal/admin/cms";
import { PLATFORM_LABELS } from "@/server/dal/public/content";

export const metadata = { title: "Edit content" };

export default async function EditContentPage(props: PageProps<"/admin/content/[id]">) {
  const { id } = await props.params;
  const staff = await requirePagePermission("cms.read");
  const data = /^[0-9a-f-]{36}$/.test(id) ? await getContentForEdit(id) : null;
  if (!data) notFound();
  const platforms = await listSocialAdmin();
  const canWrite = can(staff, "content.write");
  return (
    <>
      <AdminPageHeader
        title={data.item.title}
        breadcrumbs={[{ href: "/admin/content", label: "Content" }]}
        actions={
          <>
            <StatusBadges isPublished={data.item.isPublished} isFeatured={data.item.isFeatured} />
            {can(staff, "content.delete") ? <DeleteEntityButton entity="content" id={id} redirectTo="/admin/content" label="content item" /> : null}
          </>
        }
      />
      <ContentForm action={updateContentItem.bind(null, id)} data={data} canWrite={canWrite} canPublish={can(staff, "content.publish")} platforms={platforms.map((p) => ({ id: p.id, label: `${PLATFORM_LABELS[p.platform]} @${p.handle}` }))} />
      <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section>
          <h2 className="mb-3 font-semibold">Metric history</h2>
          {data.metrics.length ? (
            <Table>
              <thead><tr><Th>Captured</Th><Th>Views</Th><Th>Likes</Th><Th>Comments</Th><Th>Shares</Th><Th>Engagement %</Th><Th>Source</Th></tr></thead>
              <tbody>
                {data.metrics.map((m) => (
                  <tr key={m.id}><Td>{formatDate(m.capturedAt)}</Td><Td>{m.views ?? "—"}</Td><Td>{m.likes ?? "—"}</Td><Td>{m.comments ?? "—"}</Td><Td>{m.shares ?? "—"}</Td><Td>{m.engagementRate ?? "—"}</Td><Td>{m.source}</Td></tr>
                ))}
              </tbody>
            </Table>
          ) : <p className="text-sm text-muted">No metrics recorded. The latest snapshot is shown publicly.</p>}
        </section>
        {canWrite ? (
          <AdminForm action={addContentMetrics.bind(null, id)} submitLabel="Record metrics">
            <FormSection title="Record metrics" description="Copy numbers from the platform's own analytics.">
              <div className="grid grid-cols-2 gap-3">
                <TextField name="views" label="Views" type="number" />
                <TextField name="likes" label="Likes" type="number" />
                <TextField name="comments" label="Comments" type="number" />
                <TextField name="shares" label="Shares" type="number" />
              </div>
              <TextField name="engagementRate" label="Engagement rate (%)" type="number" />
              <TextField name="capturedAt" label="As of" type="date" />
            </FormSection>
          </AdminForm>
        ) : null}
      </div>
    </>
  );
}
