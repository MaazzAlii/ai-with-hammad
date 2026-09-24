import type { getTeamMemberForEdit } from "@/server/dal/admin/cms";

import { AdminForm, type FormAction } from "./admin-form";
import { FormSection, SwitchField, TextAreaField, TextField } from "./fields";
import { MediaField } from "./media-picker";
import { RepeaterField } from "./repeater";

type Data = NonNullable<Awaited<ReturnType<typeof getTeamMemberForEdit>>>;

export function TeamForm({ action, data, canWrite, canPublish }: { action: FormAction; data?: Data | null; canWrite: boolean; canPublish: boolean }) {
  const m = data?.member;
  return (
    <AdminForm action={action} disabled={!canWrite} submitLabel={m ? "Save member" : "Create member"}>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-6">
          <FormSection title="Profile" description="Only publish information the person has approved.">
            <div className="grid gap-5 sm:grid-cols-2">
              <TextField name="name" label="Name" required defaultValue={m?.name} />
              <TextField name="slug" label="URL slug" required defaultValue={m?.slug} />
              <TextField name="roleTitle" label="Role" defaultValue={m?.roleTitle} />
              <TextField name="location" label="Location" defaultValue={m?.location} />
            </div>
            <TextAreaField name="bio" label="Short bio" rows={3} defaultValue={m?.bio} />
            <TextAreaField name="longBio" label="Long bio" rows={8} defaultValue={m?.longBio} hint="Markdown supported." />
            <TextAreaField name="skills" label="Skills" rows={2} defaultValue={(m?.skills ?? []).join(", ")} hint="Comma separated" />
          </FormSection>
          <FormSection title="Links">
            <TextField name="websiteUrl" label="Website" type="url" defaultValue={m?.websiteUrl} />
            <RepeaterField name="links" label="Social links" addLabel="Add link" columns={[{ key: "platform", label: "Platform", placeholder: "github, linkedin, x…" }, { key: "url", label: "URL", type: "url" }, { key: "label", label: "Label" }]} defaultValue={(data?.links ?? []).map((l) => ({ platform: l.platform, url: l.url, label: l.label }))} />
          </FormSection>
        </div>
        <div className="space-y-6">
          <FormSection title="Publishing">
            <SwitchField name="isPublished" label="Published" defaultChecked={m?.isPublished} disabled={!canPublish} />
            <SwitchField name="isFeatured" label="Core team (homepage)" defaultChecked={m?.isFeatured} disabled={!canPublish} />
          </FormSection>
          <FormSection title="Photo">
            <MediaField name="photoMediaId" label="Portrait" defaultMedia={data?.photo} uploadBucket="team-images" hint="Square or 3:4 portrait." />
          </FormSection>
        </div>
      </div>
    </AdminForm>
  );
}
