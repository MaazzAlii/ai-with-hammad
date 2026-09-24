import { ExternalLink, Trash2 } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ActionButton } from "@/components/admin/confirm-action";
import { AdminPageHeader, StatusBadges } from "@/components/admin/page-header";
import { ProjectForm } from "@/components/admin/project-form";
import { buttonVariants } from "@/components/ui/button";
import { softDelete } from "@/server/actions/cms-common";
import { updateProject } from "@/server/actions/projects";
import { can, requirePagePermission } from "@/server/auth/session";
import { getProjectForEdit, serviceOptions, teamOptions } from "@/server/dal/admin/cms";

export const metadata = { title: "Edit project" };

export default async function EditProjectPage(props: PageProps<"/admin/projects/[id]">) {
  const { id } = await props.params;
  const staff = await requirePagePermission("cms.read");
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const [data, team, services] = await Promise.all([getProjectForEdit(id), teamOptions(), serviceOptions()]);
  if (!data) notFound();
  const p = data.project;
  return (
    <>
      <AdminPageHeader
        title={p.title}
        breadcrumbs={[{ href: "/admin/projects", label: "Projects" }]}
        actions={
          <>
            <StatusBadges isPublished={p.isPublished} isFeatured={p.isFeatured} isPinned={p.isPinned} />
            {p.isPublished ? <Link href={`/projects/${p.slug}`} target="_blank" className={buttonVariants({ variant: "ghost", size: "sm" })}>View <ExternalLink /></Link> : null}
            {can(staff, "projects.delete") ? (
              <ActionButton
                variant="ghost"
                size="sm"
                redirectTo="/admin/projects"
                action={async () => {
                  "use server";
                  return softDelete("projects", id);
                }}
                confirm={{ title: "Delete project?", description: "The project is removed from the site and the CMS. Its media files stay in the media library.", confirmLabel: "Delete" }}
              >
                <Trash2 /> Delete
              </ActionButton>
            ) : null}
          </>
        }
      />
      <ProjectForm action={updateProject.bind(null, id)} data={data} canWrite={can(staff, "projects.write")} canPublish={can(staff, "projects.publish")} teamOptions={team} serviceOptions={services} />
    </>
  );
}
