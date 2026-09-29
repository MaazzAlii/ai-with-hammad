import type { AdminMedia } from "@/server/dal/admin/media";
import type { getProjectForEdit } from "@/server/dal/admin/cms";

import { AdminForm, type FormAction } from "./admin-form";
import { ChecklistField } from "./checklist-field";
import { FormSection, SelectField, SwitchField, TextAreaField, TextField } from "./fields";
import { MediaField } from "./media-picker";
import { ProjectMediaEditor } from "./project-media-editor";
import { RepeaterField } from "./repeater";
import { TeamPicker } from "./team-picker";

const STATUS_OPTIONS = [
  { value: "live", label: "Live" },
  { value: "in_progress", label: "In progress" },
  { value: "archived", label: "Archived" },
];

type Data = NonNullable<Awaited<ReturnType<typeof getProjectForEdit>>>;

const MD_HINT = "Markdown supported: ## headings, **bold**, lists, [links](https://…).";

export function ProjectForm({
  action,
  data,
  canPublish,
  canWrite,
  teamOptions,
  serviceOptions,
}: {
  action: FormAction;
  data?: Data | null;
  canPublish: boolean;
  canWrite: boolean;
  teamOptions: { id: string; name: string }[];
  serviceOptions: { id: string; title: string }[];
}) {
  const p = data?.project;
  const media = data?.mediaMap ?? new Map<string, AdminMedia>();
  return (
    <AdminForm action={action} submitLabel={p ? "Save project" : "Create project"} disabled={!canWrite}>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-6">
          <FormSection title="Basics">
            <TextField name="title" label="Title" required defaultValue={p?.title} maxLength={160} />
            <TextField name="slug" label="URL slug" required defaultValue={p?.slug} hint="Lowercase words separated by hyphens, e.g. invoice-automation" />
            <TextField name="subtitle" label="Subtitle" defaultValue={p?.subtitle} />
            <TextAreaField name="summary" label="Short summary" rows={3} defaultValue={p?.summary} hint="Shown on cards and used as the meta description if no SEO description is set." />
            <div className="grid gap-5 sm:grid-cols-2">
              <TextField name="category" label="Category" defaultValue={p?.category} placeholder="e.g. Automation" />
              <TextField name="industry" label="Industry" defaultValue={p?.industry} />
              <TextField name="clientName" label="Client (only if permitted to disclose)" defaultValue={p?.clientName} />
              <TextField name="projectYear" label="Year" type="number" defaultValue={p?.projectYear} />
              <TextField name="durationLabel" label="Duration" defaultValue={p?.durationLabel} placeholder="e.g. 3 weeks" />
              <SelectField name="status" label="Project status" defaultValue={p?.status ?? "live"} options={STATUS_OPTIONS} />
              <TextField name="projectUrl" label="Live URL" type="url" defaultValue={p?.projectUrl} />
              <TextField name="repositoryUrl" label="Repository URL" type="url" defaultValue={p?.repositoryUrl} />
            </div>
            <MediaField name="clientLogoMediaId" label="Client logo (optional, only with permission)" defaultMedia={p?.clientLogoMediaId ? media.get(p.clientLogoMediaId) : null} uploadBucket="project-images" hint="Transparent PNG. Only add this if the client has agreed to be named publicly." />
          </FormSection>
          <FormSection title="Case study" description={MD_HINT}>
            <TextAreaField name="overview" label="Overview" rows={5} defaultValue={p?.overview} />
            <TextAreaField name="problem" label="Problem" rows={5} defaultValue={p?.problem} />
            <TextAreaField name="approach" label="Approach" rows={5} defaultValue={p?.approach} />
            <TextAreaField name="architecture" label="Architecture" rows={5} defaultValue={p?.architecture} hint="Diagrams added under Media (type: Architecture diagram) appear in this section." />
            <TextAreaField name="implementation" label="Implementation" rows={5} defaultValue={p?.implementation} />
            <TextAreaField name="results" label="Results" rows={5} defaultValue={p?.results} hint="Only state results you can support." />
          </FormSection>
          <FormSection title="Additional details" description={`${MD_HINT} All optional — each section only shows on the public page once you write something here.`}>
            <TextAreaField name="challenges" label="Challenges faced" rows={4} defaultValue={p?.challenges} />
            <TextAreaField name="lessonsLearned" label="Lessons learned" rows={4} defaultValue={p?.lessonsLearned} />
            <TextAreaField name="roiSummary" label="ROI breakdown" rows={4} defaultValue={p?.roiSummary} hint="e.g. cost saved vs. cost of the build — only if you can support the numbers." />
            <TextAreaField name="scalabilityNotes" label="Scalability" rows={3} defaultValue={p?.scalabilityNotes} />
            <TextAreaField name="securityMeasures" label="Security & data privacy" rows={3} defaultValue={p?.securityMeasures} />
            <TextAreaField name="feedbackProcess" label="Client feedback loop" rows={3} defaultValue={p?.feedbackProcess} />
            <TextAreaField name="futureRoadmap" label="Future roadmap" rows={3} defaultValue={p?.futureRoadmap} />
          </FormSection>
          <FormSection title="Media" description="Gallery images, screenshots, diagrams, videos (upload, YouTube, Vimeo), documents and links. Drag to reorder.">
            <ProjectMediaEditor
              name="media"
              defaultMedia={[...media.values()]}
              defaultItems={(data?.media ?? []).map((m) => ({ type: m.type, mediaAssetId: m.mediaAssetId, externalUrl: m.externalUrl ?? "", posterMediaId: m.posterMediaId, title: m.title, caption: m.caption, altText: m.altText }))}
            />
          </FormSection>
          <FormSection title="Outcomes & features">
            <RepeaterField name="metrics" label="Metrics" addLabel="Add metric" columns={[{ key: "value", label: "Value", placeholder: "e.g. 12 h/week" }, { key: "label", label: "Label", placeholder: "Time saved" }, { key: "description", label: "Context" }]} defaultValue={(data?.metrics ?? []).map((m) => ({ value: m.value, label: m.label, description: m.description }))} />
            <RepeaterField name="features" label="Key features" addLabel="Add feature" columns={[{ key: "title", label: "Title" }, { key: "description", label: "Description", type: "textarea" }]} defaultValue={(data?.features ?? []).map((f) => ({ title: f.title, description: f.description }))} />
          </FormSection>
        </div>
        <div className="space-y-6">
          <FormSection title="Publishing">
            <SwitchField name="isPublished" label="Published" defaultChecked={p?.isPublished} disabled={!canPublish} hint={!canPublish ? "Requires publish permission" : undefined} />
            <SwitchField name="isFeatured" label="Featured" defaultChecked={p?.isFeatured} disabled={!canPublish} />
            <SwitchField name="isPinned" label="Pinned to homepage" defaultChecked={p?.isPinned} disabled={!canPublish} />
          </FormSection>
          <FormSection title="Cover image">
            <MediaField name="coverMediaId" label="Cover" defaultMedia={p?.coverMediaId ? media.get(p.coverMediaId) : null} uploadBucket="project-images" hint="16:9 recommended, at least 1600px wide." />
          </FormSection>
          <FormSection title="Taxonomy">
            <TextAreaField name="technologies" label="Technologies" rows={3} defaultValue={(data?.tags ?? []).filter((t) => t.kind === "technology").map((t) => t.label).join(", ")} hint="Comma separated" />
            <TextAreaField name="topics" label="Topics" rows={2} defaultValue={(data?.tags ?? []).filter((t) => t.kind === "topic").map((t) => t.label).join(", ")} />
            <TextAreaField name="integrations" label="Integrations" rows={2} defaultValue={(data?.tags ?? []).filter((t) => t.kind === "integration").map((t) => t.label).join(", ")} hint="e.g. HubSpot, Slack, Stripe. Comma separated." />
            <ChecklistField name="serviceIds" label="Related services" options={serviceOptions.map((s) => ({ value: s.id, label: s.title }))} defaultValue={data?.serviceIds} />
          </FormSection>
          <FormSection title="Team">
            <TeamPicker name="team" options={teamOptions} defaultValue={(data?.team ?? []).map((t) => ({ teamMemberId: t.teamMemberId, roleOnProject: t.roleOnProject }))} />
          </FormSection>
          <FormSection title="SEO">
            <TextField name="seoTitle" label="SEO title" defaultValue={p?.seoTitle} maxLength={70} hint="Max 70 characters" />
            <TextAreaField name="seoDescription" label="Meta description" rows={3} defaultValue={p?.seoDescription} hint="Max 170 characters" />
          </FormSection>
        </div>
      </div>
    </AdminForm>
  );
}
