import { Plus } from "lucide-react";
import Link from "next/link";

import { EntityRow } from "@/components/admin/entity-row";
import { AdminPageHeader } from "@/components/admin/page-header";
import { SortableList } from "@/components/admin/sortable-list";
import { EmptyState } from "@/components/site/section";
import { buttonVariants } from "@/components/ui/button";
import { reorder } from "@/server/actions/cms-common";
import { can, requirePagePermission } from "@/server/auth/session";
import { listTeamAdmin } from "@/server/dal/admin/cms";
import { getMediaMany } from "@/server/dal/admin/media";

export const metadata = { title: "Team" };

export default async function TeamAdminPage() {
  const staff = await requirePagePermission("cms.read");
  const rows = await listTeamAdmin();
  const photos = await getMediaMany(rows.map((r) => r.photoMediaId));
  const canPublish = can(staff, "team.publish");
  return (
    <>
      <AdminPageHeader title="Team" description="Core team members appear on the homepage." actions={can(staff, "team.write") ? <Link href="/admin/team/new" className={buttonVariants()}><Plus /> New member</Link> : null} />
      {rows.length ? (
        <SortableList
          disabled={!canPublish}
          onReorder={async (ids) => {
            "use server";
            return reorder("team", ids);
          }}
          items={rows.map((m) => ({
            id: m.id,
            content: <EntityRow href={`/admin/team/${m.id}`} title={m.name} meta={m.roleTitle} thumb={m.photoMediaId ? photos.get(m.photoMediaId) : null} entity="team" id={m.id} canPublish={canPublish} flags={[{ flag: "isPublished", value: m.isPublished, label: "Published", offLabel: "Draft" }, { flag: "isFeatured", value: m.isFeatured, label: "Core team" }]} />,
          }))}
        />
      ) : <EmptyState title="No team members yet" />}
    </>
  );
}
