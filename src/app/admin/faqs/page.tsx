import { asc, isNull } from "drizzle-orm";

import { AdminForm } from "@/components/admin/admin-form";
import { DeleteEntityButton } from "@/components/admin/delete-button";
import { EntityRow } from "@/components/admin/entity-row";
import { FormSection, SwitchField, TextAreaField, TextField } from "@/components/admin/fields";
import { AdminPageHeader } from "@/components/admin/page-header";
import { SortableList } from "@/components/admin/sortable-list";
import { getDb } from "@/db";
import { faqs } from "@/db/schema";
import { reorder } from "@/server/actions/cms-common";
import { saveFaq } from "@/server/actions/faqs";
import { can, requirePagePermission } from "@/server/auth/session";

export const metadata = { title: "FAQs" };

export default async function FaqsPage() {
  const staff = await requirePagePermission("cms.read");
  const rows = await getDb().select().from(faqs).where(isNull(faqs.deletedAt)).orderBy(asc(faqs.sortOrder));
  const canWrite = can(staff, "faqs.write");
  return (
    <>
      <AdminPageHeader title="FAQs" description="Shown on the homepage and contact page. Drag to reorder." />
      {rows.length ? (
        <SortableList
          disabled={!canWrite}
          onReorder={async (ids) => {
            "use server";
            return reorder("faqs", ids);
          }}
          items={rows.map((f) => ({
            id: f.id,
            content: (
              <details>
                <summary className="cursor-pointer list-none">
                  <EntityRow title={f.question} meta={f.category} thumb={false} entity="faqs" id={f.id} canPublish={canWrite} flags={[{ flag: "isPublished", value: f.isPublished, label: "Published", offLabel: "Hidden" }]} />
                </summary>
                <div className="border-t border-border p-4">
                  <AdminForm action={saveFaq.bind(null, f.id)} disabled={!canWrite} compact footer={canWrite ? <DeleteEntityButton entity="faqs" id={f.id} redirectTo="/admin/faqs" label="FAQ" /> : null}>
                    <TextField name="question" label="Question" required defaultValue={f.question} />
                    <TextAreaField name="answer" label="Answer" rows={4} defaultValue={f.answer} />
                    <TextField name="category" label="Category (optional)" defaultValue={f.category} />
                    <SwitchField name="isPublished" label="Published" defaultChecked={f.isPublished} />
                  </AdminForm>
                </div>
              </details>
            ),
          }))}
        />
      ) : null}
      {canWrite ? (
        <div className="mt-8 max-w-3xl">
          <AdminForm action={saveFaq.bind(null, null)} submitLabel="Add FAQ" compact>
            <FormSection title="Add FAQ">
              <TextField name="question" label="Question" required />
              <TextAreaField name="answer" label="Answer" rows={4} />
              <TextField name="category" label="Category (optional)" />
              <SwitchField name="isPublished" label="Published" defaultChecked />
            </FormSection>
          </AdminForm>
        </div>
      ) : null}
    </>
  );
}
