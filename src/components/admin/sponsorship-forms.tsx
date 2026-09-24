import { contentPlatform, type sponsorshipPackageRates, type sponsorshipPackages, type sponsorshipPartners } from "@/db/schema";
import { PLATFORM_LABELS } from "@/server/dal/public/content";
import type { AdminMedia } from "@/server/dal/admin/media";

import { AdminForm, type FormAction } from "./admin-form";
import { FormSection, SwitchField, TextAreaField, TextField } from "./fields";
import { MediaField } from "./media-picker";

export function PackageForm({ action, pkg, canWrite, canPublish }: { action: FormAction; pkg?: typeof sponsorshipPackages.$inferSelect | null; canWrite: boolean; canPublish: boolean }) {
  return (
    <AdminForm action={action} disabled={!canWrite} submitLabel={pkg ? "Save package" : "Create package"}>
      <FormSection title="Public package" description="Everything here is shown publicly. Do NOT put prices here — use Internal rates.">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField name="name" label="Name" required defaultValue={pkg?.name} />
          <TextField name="slug" label="Slug" required defaultValue={pkg?.slug} />
        </div>
        <TextAreaField name="summary" label="Summary" rows={3} defaultValue={pkg?.summary} />
        <TextAreaField name="deliverables" label="Deliverables" rows={4} defaultValue={(pkg?.deliverables ?? []).join("\n")} hint="One per line" />
        <fieldset>
          <legend className="text-sm font-medium">Platforms</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {contentPlatform.enumValues.map((p) => (
              <label key={p} className="inline-flex min-h-10 items-center gap-2 rounded-control border border-border-strong px-3 text-sm has-checked:border-accent has-checked:bg-accent-soft">
                <input type="checkbox" name="platforms[]" value={p} defaultChecked={pkg?.platforms.includes(p)} className="accent-[var(--color-accent)]" />
                {PLATFORM_LABELS[p]}
              </label>
            ))}
          </div>
        </fieldset>
        <SwitchField name="isPublished" label="Published" defaultChecked={pkg?.isPublished} disabled={!canPublish} />
      </FormSection>
    </AdminForm>
  );
}

export function RatesForm({ action, rates }: { action: FormAction; rates: typeof sponsorshipPackageRates.$inferSelect | null }) {
  return (
    <AdminForm action={action} submitLabel="Save internal rates">
      <FormSection title="Internal rates (confidential)" description="Visible only to roles with the sponsorship.rates permission. Never shown on the website or in public APIs.">
        <div className="grid gap-5 sm:grid-cols-3">
          <TextField name="currency" label="Currency" defaultValue={rates?.currency ?? "USD"} maxLength={3} />
          <TextField name="standardRate" label="Standard rate" type="number" defaultValue={rates?.standardRate} />
          <TextField name="minimumRate" label="Minimum rate" type="number" defaultValue={rates?.minimumRate} />
        </div>
        <TextAreaField name="packageNotes" label="Package notes" rows={3} defaultValue={rates?.packageNotes} />
        <TextAreaField name="negotiationNotes" label="Negotiation notes" rows={3} defaultValue={rates?.negotiationNotes} />
      </FormSection>
    </AdminForm>
  );
}

export function PartnerForm({ action, partner, logo, canWrite, canPublish }: { action: FormAction; partner?: typeof sponsorshipPartners.$inferSelect | null; logo?: AdminMedia | null; canWrite: boolean; canPublish: boolean }) {
  return (
    <AdminForm action={action} disabled={!canWrite} submitLabel={partner ? "Save partner" : "Create partner"}>
      <FormSection title="Partner" description="Only list real partnerships you are allowed to disclose.">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField name="name" label="Name" required defaultValue={partner?.name} />
          <TextField name="slug" label="Slug" required defaultValue={partner?.slug} />
          <TextField name="websiteUrl" label="Website" type="url" defaultValue={partner?.websiteUrl} />
          <TextField name="partneredOn" label="Partnered on" type="date" defaultValue={partner?.partneredOn} />
        </div>
        <TextAreaField name="description" label="About the partner" rows={3} defaultValue={partner?.description} />
        <TextAreaField name="campaignSummary" label="Campaign summary" rows={3} defaultValue={partner?.campaignSummary} />
        <MediaField name="logoMediaId" label="Logo" defaultMedia={logo} uploadBucket="sponsorship-media" />
        <SwitchField name="isPublished" label="Published" defaultChecked={partner?.isPublished} disabled={!canPublish} />
      </FormSection>
    </AdminForm>
  );
}
