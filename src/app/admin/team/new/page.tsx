import { AdminPageHeader } from "@/components/admin/page-header";
import { TeamForm } from "@/components/admin/team-form";
import { createTeamMember } from "@/server/actions/team";
import { can, requirePagePermission } from "@/server/auth/session";

export const metadata = { title: "New team member" };

export default async function NewTeamMemberPage() {
  const staff = await requirePagePermission("team.write");
  return (
    <>
      <AdminPageHeader title="New team member" breadcrumbs={[{ href: "/admin/team", label: "Team" }]} />
      <TeamForm action={createTeamMember} canWrite canPublish={can(staff, "team.publish")} />
    </>
  );
}
