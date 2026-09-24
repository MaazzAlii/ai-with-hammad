import { contentPlatform } from "@/db/schema";
import { PLATFORM_LABELS } from "@/server/dal/public/content";
import type { getContentForEdit } from "@/server/dal/admin/cms";

import { AdminForm, type FormAction } from "./admin-form";
import { FormSection, SelectField, SwitchField, TextAreaField, TextField } from "./fields";
import { MediaField } from "./media-picker";

type Data = NonNullable<Awaited<ReturnType<typeof getContentForEdit>>>;

export function ContentForm({ action, data, canWrite, canPublish, platforms }: { action: FormAction; data?: Data | null; canWrite: boolean; canPublish: boolean; platforms: { id: string; label: string }[] }) {
  const c = data?.item;
  return (
    <AdminForm action={action} disabled={!canWrite} submitLabel={c ? "Save content" : "Create content"}>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-6">
          <FormSection title="Content" description="Enter details manually — nothing is scraped from social platforms.">
            <TextField name="title" label="Title" required defaultValue={c?.title} />
            <TextField name="slug" label="URL slug" required defaultValue={c?.slug} />
            <div className="grid gap-5 sm:grid-cols-2">
              <SelectField name="platform" label="Platform" defaultValue={c?.platform ?? "youtube"} options={contentPlatform.enumValues.map((p) => ({ value: p, label: PLATFORM_LABELS[p] }))} />
              <SelectField name="socialPlatformId" label="Channel / profile" defaultValue={c?.socialPlatformId ?? ""} options={[{ value: "", label: "—" }, ...platforms.map((p) => ({ value: p.id, label: p.label }))]} />
            </div>
            <TextField name="url" label="Post URL" type="url" required defaultValue={c?.url} hint="Public link to the post (https)." />
            <TextField name="embedUrl" label="Embed URL (optional)" type="url" defaultValue={c?.embedUrl} hint="Leave empty to derive the embed from the post URL. Supported: YouTube, Vimeo, TikTok, Instagram, Facebook, LinkedIn." />
            <TextAreaField name="description" label="Description" rows={6} defaultValue={c?.description} hint="Markdown supported." />
            <div className="grid gap-5 sm:grid-cols-2">
              <TextField name="publishedDate" label="Published on" type="date" defaultValue={c?.publishedDate} />
              <TextField name="category" label="Category" defaultValue={c?.category} />
            </div>
          </FormSection>
        </div>
        <div className="space-y-6">
          <FormSection title="Publishing & highlights">
            <SwitchField name="isPublished" label="Published" defaultChecked={c?.isPublished} disabled={!canPublish} />
            <SwitchField name="isFeatured" label="Featured" defaultChecked={c?.isFeatured} disabled={!canPublish} />
            <SwitchField name="isHighPerforming" label="High performing" defaultChecked={c?.isHighPerforming} disabled={!canPublish} />
            <SwitchField name="isCampaign" label="Campaign content" defaultChecked={c?.isCampaign} disabled={!canPublish} />
            <SwitchField name="isCaseStudy" label="Case study" defaultChecked={c?.isCaseStudy} disabled={!canPublish} />
            <TextField name="performanceRank" label="Performance rank" type="number" defaultValue={c?.performanceRank} hint="1 = best. Orders the high-performing list." />
          </FormSection>
          <FormSection title="Thumbnail">
            <MediaField name="thumbnailMediaId" label="Thumbnail" defaultMedia={data?.thumbnail} uploadBucket="content-thumbnails" hint="Optional for YouTube (thumbnail derived automatically)." />
          </FormSection>
        </div>
      </div>
    </AdminForm>
  );
}
