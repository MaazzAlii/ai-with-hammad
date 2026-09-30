import type { getTeamMemberForEdit } from "@/server/dal/admin/cms";

import { AdminForm, type FormAction } from "./admin-form";
import { FormSection, SelectField, SwitchField, TextAreaField, TextField } from "./fields";
import { MediaField } from "./media-picker";
import { RepeaterField } from "./repeater";

const MEMBER_TYPE_OPTIONS = [
  { value: "team", label: "Team" },
  { value: "advisor", label: "Advisor / mentor" },
];

type Data = NonNullable<Awaited<ReturnType<typeof getTeamMemberForEdit>>>;

export function TeamForm({ action, data, canWrite, canPublish }: { action: FormAction; data?: Data | null; canWrite: boolean; canPublish: boolean }) {
  const m = data?.member;
  return (
    <AdminForm action={action} disabled={!canWrite} submitLabel={m ? "Save member" : "Create member"}>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-6">
          <FormSection title="Profile" description="Only publish information the person has approved.">
            <div className="grid gap-5 sm:grid-cols-2">
              {m?.isLocked ? (
                <>
                  <TextField name="name" label="Name" defaultValue={m.name} readOnly hint="Founder — name is fixed." />
                  <TextField name="slug" label="URL slug" defaultValue={m.slug} readOnly hint="Fixed" />
                </>
              ) : (
                <>
                  <TextField name="name" label="Name" required defaultValue={m?.name} />
                  <TextField name="slug" label="URL slug" required defaultValue={m?.slug} />
                </>
              )}
              <TextField name="roleTitle" label="Role" defaultValue={m?.roleTitle} />
              <TextField name="location" label="Location" defaultValue={m?.location} />
              <TextField name="timezone" label="Timezone" defaultValue={m?.timezone} placeholder="e.g. UTC+5 (Pakistan)" />
              <TextField name="email" label="Public email (optional)" type="email" defaultValue={m?.email} hint="Shown as a Contact button. Leave empty to hide." />
            </div>
            <TextAreaField name="bio" label="Short bio" rows={3} defaultValue={m?.bio} />
            <TextAreaField name="longBio" label="Long bio" rows={8} defaultValue={m?.longBio} hint="Markdown supported." />
            <TextAreaField name="philosophy" label="How I think" rows={3} defaultValue={m?.philosophy} hint="A short personal take on how they approach the work. Optional." />
            <TextField name="funFact" label="Fun fact" defaultValue={m?.funFact} placeholder="e.g. Can solve a Rubik's cube in under a minute" />
            <div className="grid gap-5 sm:grid-cols-3">
              <TextAreaField name="skills" label="Skills" rows={2} defaultValue={(m?.skills ?? []).join(", ")} hint="Comma separated" />
              <TextAreaField name="languages" label="Languages" rows={2} defaultValue={(m?.languages ?? []).join(", ")} hint="Comma separated" />
              <TextAreaField name="certifications" label="Certifications" rows={2} defaultValue={(m?.certifications ?? []).join(", ")} hint="Comma separated, e.g. AWS, OpenAI" />
            </div>
          </FormSection>
          <FormSection title="Links">
            <TextField name="websiteUrl" label="Website" type="url" defaultValue={m?.websiteUrl} />
            <RepeaterField name="links" label="Social links" addLabel="Add link" columns={[{ key: "platform", label: "Platform", placeholder: "github, linkedin, x…" }, { key: "url", label: "URL", type: "url" }, { key: "label", label: "Label" }]} defaultValue={(data?.links ?? []).map((l) => ({ platform: l.platform, url: l.url, label: l.label }))} />
          </FormSection>
          <FormSection title="Speaking & appearances" description="Talks, podcasts, interviews — real ones only.">
            <RepeaterField
              name="appearances"
              label="Appearances"
              addLabel="Add appearance"
              columns={[{ key: "title", label: "Title" }, { key: "venue", label: "Venue / show" }, { key: "url", label: "URL", type: "url" }, { key: "appearedOn", label: "Date (YYYY-MM-DD)" }]}
              defaultValue={(data?.appearances ?? []).map((a) => ({ title: a.title, venue: a.venue, url: a.url ?? "", appearedOn: a.appearedOn ?? "" }))}
            />
          </FormSection>
        </div>
        <div className="space-y-6">
          <FormSection title="Publishing">
            <SwitchField name="isPublished" label="Published" defaultChecked={m?.isPublished} disabled={!canPublish} />
            <SwitchField name="isFeatured" label="Core team (homepage)" defaultChecked={m?.isFeatured} disabled={!canPublish} />
            <SelectField name="memberType" label="Type" defaultValue={m?.memberType ?? "team"} options={MEMBER_TYPE_OPTIONS} hint="Advisors show in a separate section on the Team page." />
          </FormSection>
          <FormSection title="Photo">
            <MediaField
              name="photoMediaId"
              label="Portrait"
              defaultMedia={data?.photo}
              uploadBucket="team-images"
              hint="Square or 3:4 portrait, e.g. 1000×1000 or 1200×1600px. JPG/PNG/WebP up to 6 MB — a phone photo straight off the camera is usually much bigger than needed and will upload/load slower, so resize it first if you can."
            />
          </FormSection>
        </div>
      </div>
    </AdminForm>
  );
}
