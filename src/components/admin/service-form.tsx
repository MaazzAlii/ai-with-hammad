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
            <TextAreaField name="idealFor" label="Who this is for" rows={2} defaultValue={s?.idealFor} placeholder="e.g. SaaS founders, agencies scaling ops" />
            <TextAreaField name="techStack" label="Tech stack" rows={2} defaultValue={(s?.techStack ?? []).join(", ")} hint="Comma separated, e.g. n8n, Postgres, OpenAI" />
          </FormSection>
          <FormSection title="What's included">
            <RepeaterField name="features" label="Features" addLabel="Add feature" columns={[{ key: "title", label: "Title" }, { key: "description", label: "Description", type: "textarea" }]} defaultValue={(data?.features ?? []).map((f) => ({ title: f.title, description: f.description }))} />
          </FormSection>
          <FormSection title="Add-ons" description="Optional extras a client can add (maintenance, hosting, monitoring…).">
            <RepeaterField
              name="addOns"
              label="Add-ons"
              addLabel="Add add-on"
              columns={[{ key: "title", label: "Title" }, { key: "priceNote", label: "Price note", placeholder: "e.g. +$100/mo" }, { key: "description", label: "Description", type: "textarea" }]}
              defaultValue={(data?.addOns ?? []).map((a) => ({ title: a.title, priceNote: a.priceNote, description: a.description }))}
            />
          </FormSection>
          <FormSection title="Engagement" description="All optional — each shows on the public page only once you write something here.">
            <div className="grid gap-5 sm:grid-cols-2">
              <TextField name="startingAtPrice" label="Starting at" defaultValue={s?.startingAtPrice} placeholder="e.g. From $800" />
              <TextField name="timelineEstimate" label="Timeline estimate" defaultValue={s?.timelineEstimate} placeholder="e.g. 2-4 weeks" />
            </div>
            <TextAreaField name="engagementTerms" label="Terms of engagement" rows={3} defaultValue={s?.engagementTerms} hint="Retainer vs. fixed price, payment terms, etc." />
            <TextAreaField name="slaNotes" label="SLA details" rows={3} defaultValue={s?.slaNotes} hint="Response times, uptime, support hours — for enterprise clients." />
            <TextAreaField name="comparisonNotes" label="Why us vs. alternatives" rows={3} defaultValue={s?.comparisonNotes} hint="Only factual, fair comparisons — no disparaging claims." />
          </FormSection>
          <FormSection title="How we deliver it">
            <TextAreaField name="processNotes" label="Process" rows={4} defaultValue={s?.processNotes} hint="Markdown supported. Steps specific to this service." />
            <TextAreaField name="technicalNotes" label="Security, rate limits & error handling" rows={4} defaultValue={s?.technicalNotes} hint="Markdown supported (``` code fences work for snippets)." />
            <TextAreaField name="trainingAndDocs" label="Training & documentation" rows={4} defaultValue={s?.trainingAndDocs} hint="What the client's team receives — training sessions, docs, handover materials." />
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
            <TextField name="videoUrl" label="Video demo (YouTube/Vimeo URL, optional)" type="url" defaultValue={s?.videoUrl} />
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
