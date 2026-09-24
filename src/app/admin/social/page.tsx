import { AdminForm } from "@/components/admin/admin-form";
import { EntityRow } from "@/components/admin/entity-row";
import { FormSection, SelectField, SwitchField, TextField } from "@/components/admin/fields";
import { AdminPageHeader } from "@/components/admin/page-header";
import { SortableList } from "@/components/admin/sortable-list";
import { contentPlatform } from "@/db/schema";
import { formatCompactNumber } from "@/lib/utils";
import { reorder } from "@/server/actions/cms-common";
import { saveSocialPlatform } from "@/server/actions/content";
import { can, requirePagePermission } from "@/server/auth/session";
import { listSocialAdmin } from "@/server/dal/admin/cms";
import { PLATFORM_LABELS } from "@/server/dal/public/content";

export const metadata = { title: "Social platforms" };

function PlatformFields({ p }: { p?: Awaited<ReturnType<typeof listSocialAdmin>>[number] }) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField name="platform" label="Platform" defaultValue={p?.platform ?? "youtube"} options={contentPlatform.enumValues.map((v) => ({ value: v, label: PLATFORM_LABELS[v] }))} />
        <TextField name="handle" label="Handle" required defaultValue={p?.handle} placeholder="aiwithhamad" />
        <TextField name="displayName" label="Display name" defaultValue={p?.displayName} />
        <TextField name="profileUrl" label="Profile URL" type="url" required defaultValue={p?.profileUrl} />
        <TextField name="followers" label="Followers" type="number" defaultValue={p?.followers} hint="Manual value — shown with its date." />
        <TextField name="followersUpdatedAt" label="Followers as of" type="date" defaultValue={p?.followersUpdatedAt} />
      </div>
      <TextField name="description" label="Description" defaultValue={p?.description} />
      <SwitchField name="isActive" label="Show on website" defaultChecked={p?.isActive ?? true} />
    </>
  );
}

export default async function SocialAdminPage() {
  const staff = await requirePagePermission("cms.read");
  const rows = await listSocialAdmin();
  const canWrite = can(staff, "content.write");
  const canPublish = can(staff, "content.publish");
  return (
    <>
      <AdminPageHeader title="Social platforms" description="Channels shown on the content, sponsorship and media-kit pages. Values are entered manually; official API providers can be added later." />
      {rows.length ? (
        <SortableList
          disabled={!canPublish}
          onReorder={async (ids) => {
            "use server";
            return reorder("social", ids);
          }}
          items={rows.map((p) => ({
            id: p.id,
            content: (
              <details className="group">
                <summary className="cursor-pointer list-none">
                  <EntityRow title={`${PLATFORM_LABELS[p.platform]} · @${p.handle}`} meta={p.followers != null ? `${formatCompactNumber(p.followers)} followers` : undefined} thumb={false} entity="social" id={p.id} canPublish={canPublish} flags={[{ flag: "isActive", value: p.isActive, label: "Visible", offLabel: "Hidden" }]} />
                </summary>
                <div className="border-t border-border p-4">
                  <AdminForm action={saveSocialPlatform.bind(null, p.id)} disabled={!canWrite}>
                    <PlatformFields p={p} />
                  </AdminForm>
                </div>
              </details>
            ),
          }))}
        />
      ) : null}
      {canWrite ? (
        <div className="mt-8">
          <AdminForm action={saveSocialPlatform.bind(null, null)} submitLabel="Add platform">
            <FormSection title="Add platform">
              <PlatformFields />
            </FormSection>
          </AdminForm>
        </div>
      ) : null}
    </>
  );
}
