import { notFound } from "next/navigation";

import { DeleteEntityButton } from "@/components/admin/delete-button";
import { AdminPageHeader, StatusBadges } from "@/components/admin/page-header";
import { TeamForm } from "@/components/admin/team-form";
import { updateTeamMember } from "@/server/actions/team";
import { can, requirePagePermission } from "@/server/auth/session";
import { getTeamMemberForEdit } from "@/server/dal/admin/cms";

export const metadata = { title: "Edit team member" };

export default async function EditTeamMemberPage(props: PageProps<"/admin/team/[id]">) {
  const { id } = await props.params;
  const staff = await requirePagePermission("cms.read");
  const data = /^[0-9a-f-]{36}$/.test(id) ? await getTeamMemberForEdit(id) : null;
  if (!data) notFound();
  return (
    <>
      <AdminPageHeader
        title={data.member.name}
        breadcrumbs={[{ href: "/admin/team", label: "Team" }]}
        actions={
          <>
            <StatusBadges isPublished={data.member.isPublished} isFeatured={data.member.isFeatured} />
            {can(staff, "team.delete") ? <DeleteEntityButton entity="team" id={id} redirectTo="/admin/team" label="team member" /> : null}
          </>
        }
      />
      <TeamForm action={updateTeamMember.bind(null, id)} data={data} canWrite={can(staff, "team.write")} canPublish={can(staff, "team.publish")} />
    </>
  );
}
