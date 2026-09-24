import { AdminPageHeader } from "@/components/admin/page-header";
import { ProjectForm } from "@/components/admin/project-form";
import { createProject } from "@/server/actions/projects";
import { can, requirePagePermission } from "@/server/auth/session";
import { serviceOptions, teamOptions } from "@/server/dal/admin/cms";

export const metadata = { title: "New project" };

export default async function NewProjectPage() {
  const staff = await requirePagePermission("projects.write");
  const [team, services] = await Promise.all([teamOptions(), serviceOptions()]);
  return (
    <>
      <AdminPageHeader title="New project" breadcrumbs={[{ href: "/admin/projects", label: "Projects" }]} />
      <ProjectForm action={createProject} canWrite canPublish={can(staff, "projects.publish")} teamOptions={team} serviceOptions={services} />
    </>
  );
}
