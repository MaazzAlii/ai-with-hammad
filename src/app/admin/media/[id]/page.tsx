import { Trash2 } from "lucide-react";
import { notFound } from "next/navigation";

import { AdminForm } from "@/components/admin/admin-form";
import { ActionButton } from "@/components/admin/confirm-action";
import { CopyButton } from "@/components/admin/copy-button";
import { FormSection, TextAreaField, TextField } from "@/components/admin/fields";
import { MediaLibraryUploader } from "@/components/admin/media-library-uploader";
import { MediaThumb } from "@/components/admin/media-thumb";
import { AdminPageHeader } from "@/components/admin/page-header";
import { BUCKETS, isBucketId } from "@/lib/media/buckets";
import { formatBytes, formatDate } from "@/lib/utils";
import { deleteMedia, updateMedia } from "@/server/actions/media";
import { can, requirePagePermission } from "@/server/auth/session";
import { getMedia, mediaUsage } from "@/server/dal/admin/media";

export const metadata = { title: "Media" };

export default async function MediaDetailPage(props: PageProps<"/admin/media/[id]">) {
  const { id } = await props.params;
  const staff = await requirePagePermission("cms.read");
  const media = /^[0-9a-f-]{36}$/.test(id) ? await getMedia(id) : null;
  if (!media) notFound();
  const usage = await mediaUsage(id);
  const meta: [string, string][] = [
    ["Type", media.mimeType],
    ["Size", formatBytes(media.sizeBytes)],
    ["Dimensions", media.width ? `${media.width} × ${media.height}px` : "—"],
    ["Duration", media.durationSeconds ? `${media.durationSeconds}s` : "—"],
    ["Bucket", isBucketId(media.bucket) ? BUCKETS[media.bucket].label : media.bucket],
    ["Path", media.path],
    ["Original name", media.originalFilename],
    ["Uploaded", formatDate(media.createdAt, { hour: "2-digit", minute: "2-digit" })],
    ["Visibility", media.isPublic ? "Public URL" : "Private (signed URLs only)"],
  ];
  return (
    <>
      <AdminPageHeader
        title={media.filename}
        breadcrumbs={[{ href: "/admin/media", label: "Media library" }]}
        actions={
          <>
            {media.url ? <CopyButton value={media.url} /> : null}
            {can(staff, "media.delete") ? (
              <ActionButton
                variant="ghost"
                size="sm"
                redirectTo="/admin/media"
                action={async () => {
                  "use server";
                  return deleteMedia(id);
                }}
                confirm={{ title: "Delete file?", description: usage.length ? "This file is in use and cannot be deleted until it is removed from those items." : "The file is permanently removed from storage.", confirmLabel: "Delete" }}
              >
                <Trash2 /> Delete
              </ActionButton>
            ) : null}
          </>
        }
      />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-6">
          <div className="overflow-hidden surface-solid rounded-card bg-surface-2">
            {media.kind === "image" && media.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={media.url} alt={media.altText} className="mx-auto max-h-[60vh] w-auto" />
            ) : media.kind === "video" && media.url ? (
              <video src={media.url} controls preload="metadata" className="max-h-[60vh] w-full" />
            ) : (
              <div className="grid place-items-center p-10"><MediaThumb media={media} className="w-32" /></div>
            )}
          </div>
          <AdminForm action={updateMedia.bind(null, id)} disabled={!can(staff, "media.update")}>
            <FormSection title="Details">
              <TextField name="filename" label="Display name" required defaultValue={media.filename} />
              <TextField name="altText" label="Alt text" defaultValue={media.altText} hint="Describe what the image shows for screen-reader users. Leave empty only for purely decorative images." />
              <TextAreaField name="caption" label="Caption" rows={2} defaultValue={media.caption} />
            </FormSection>
          </AdminForm>
        </div>
        <div className="space-y-6">
          <section className="glass-card rounded-card p-5">
            <h2 className="font-semibold">Metadata</h2>
            <dl className="mt-3 space-y-2 text-sm">
              {meta.map(([k, v]) => (
                <div key={k}><dt className="text-xs text-subtle">{k}</dt><dd className="break-all">{v}</dd></div>
              ))}
            </dl>
          </section>
          <section className="glass-card rounded-card p-5">
            <h2 className="font-semibold">Used in</h2>
            {usage.length ? <ul className="mt-2 space-y-1 text-sm text-muted">{usage.map((u) => <li key={u}>{u}</li>)}</ul> : <p className="mt-2 text-sm text-muted">Not used anywhere.</p>}
          </section>
          {can(staff, "media.update") && isBucketId(media.bucket) ? (
            <section className="glass-card rounded-card p-5">
              <h2 className="mb-3 font-semibold">Replace file</h2>
              <p className="mb-3 text-xs text-subtle">Keeps this record (and every place it is used) but swaps the file. Must be the same kind of file.</p>
              <MediaLibraryUploader replaceId={id} buckets={[media.bucket]} defaultBucket={media.bucket} />
            </section>
          ) : null}
        </div>
      </div>
    </>
  );
}
