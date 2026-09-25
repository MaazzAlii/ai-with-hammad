import { SERVICE_ICON_NAMES } from "@/components/site/icons";
import type { getServiceForEdit } from "@/server/dal/admin/cms";

import { AdminForm, type FormAction } from "./admin-form";
import { FormSection, SelectField, SwitchField, TextAreaField, TextField } from "./fields";
import { MediaField } from "./media-picker";
import { RepeaterField } from "./repeater";

type Data = NonNullable<Awaited<ReturnType<typeof getServiceForEdit>>>;

export function ServiceForm({ action, data, canWrite, canPublish }: { action: FormAction; data?: Data | null; canWrite: boolean; canPublish: boolean }) {
  const s = data?.service;
  return (
    <AdminForm action={action} disabled={!canWrite} submitLabel={s ? "Save service" : "Create service"}>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-6">
          <FormSection title="Service">
            <TextField name="title" label="Title" required defaultValue={s?.title} />
            <TextField name="slug" label="URL slug" required defaultValue={s?.slug} />
            <TextAreaField name="summary" label="Summary" rows={3} defaultValue={s?.summary} />
            <TextAreaField name="description" label="Description" rows={10} defaultValue={s?.description} hint="Markdown supported." />
          </FormSection>
          <FormSection title="What's included">
            <RepeaterField name="features" label="Features" addLabel="Add feature" columns={[{ key: "title", label: "Title" }, { key: "description", label: "Description", type: "textarea" }]} defaultValue={(data?.features ?? []).map((f) => ({ title: f.title, description: f.description }))} />
          </FormSection>
        </div>
        <div className="space-y-6">
          <FormSection title="Publishing">
            <SwitchField name="isPublished" label="Published" defaultChecked={s?.isPublished} disabled={!canPublish} />
            <SwitchField name="isFeatured" label="Featured" defaultChecked={s?.isFeatured} disabled={!canPublish} />
          </FormSection>
          <FormSection title="Presentation">
            <SelectField name="icon" label="Icon" defaultValue={s?.icon ?? "sparkles"} options={SERVICE_ICON_NAMES.map((n) => ({ value: n, label: n }))} />
            <MediaField name="coverMediaId" label="Cover image (optional)" defaultMedia={data?.cover} uploadBucket="media-library" />
          </FormSection>
          <FormSection title="SEO">
            <TextField name="seoTitle" label="SEO title" defaultValue={s?.seoTitle} maxLength={70} />
            <TextAreaField name="seoDescription" label="Meta description" rows={3} defaultValue={s?.seoDescription} />
          </FormSection>
        </div>
      </div>
    </AdminForm>
  );
}
