import { AdminPageHeader } from "@/components/admin/page-header";
import { ContentForm } from "@/components/admin/content-form";
import { createContentItem } from "@/server/actions/content";
import { can, requirePagePermission } from "@/server/auth/session";
import { listSocialAdmin, teamOptions } from "@/server/dal/admin/cms";
import { PLATFORM_LABELS } from "@/server/dal/public/content";

export const metadata = { title: "New content" };

export default async function NewContentPage() {
  const staff = await requirePagePermission("content.write");
  const [platforms, team] = await Promise.all([listSocialAdmin(), teamOptions()]);
  return (
    <>
      <AdminPageHeader title="New content" breadcrumbs={[{ href: "/admin/content", label: "Content" }]} />
      <ContentForm action={createContentItem} canWrite canPublish={can(staff, "content.publish")} platforms={platforms.map((p) => ({ id: p.id, label: `${PLATFORM_LABELS[p.platform]} @${p.handle}` }))} teamOptions={team} />
    </>
  );
}
