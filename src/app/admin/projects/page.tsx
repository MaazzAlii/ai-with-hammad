import { Plus } from "lucide-react";
import Link from "next/link";

import { FlagToggle } from "@/components/admin/flag-toggle";
import { MediaThumb } from "@/components/admin/media-thumb";
import { AdminPageHeader } from "@/components/admin/page-header";
import { SortableList } from "@/components/admin/sortable-list";
import { EmptyState } from "@/components/site/section";
import { buttonVariants } from "@/components/ui/button";
import { reorder } from "@/server/actions/cms-common";
import { can, requirePagePermission } from "@/server/auth/session";
import { listProjectsAdmin } from "@/server/dal/admin/cms";
import { getMediaMany } from "@/server/dal/admin/media";

export const metadata = { title: "Projects" };

export default async function ProjectsAdminPage() {
  const staff = await requirePagePermission("cms.read");
  const rows = await listProjectsAdmin();
  const covers = await getMediaMany(rows.map((r) => r.coverMediaId));
  const canPublish = can(staff, "projects.publish");
  return (
    <>
      <AdminPageHeader
        title="Projects"
        description={`${rows.length} project${rows.length === 1 ? "" : "s"}. ${canPublish ? "Drag to reorder. Pinned projects appear on the homepage." : ""}`}
        actions={can(staff, "projects.write") ? <Link href="/admin/projects/new" className={buttonVariants()}><Plus /> New project</Link> : null}
      />
      {rows.length ? (
        <SortableList
          items={rows}
          disabled={!canPublish}
          onReorder={async (ids) => {
            "use server";
            return reorder("projects", ids);
          }}
          render={(p) => (
            <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
              <MediaThumb media={p.coverMediaId ? (covers.get(p.coverMediaId) ?? null) : null} className="hidden size-14 shrink-0 sm:grid" />
              <div className="min-w-0 flex-1">
                <Link href={`/admin/projects/${p.id}`} className="font-medium hover:text-accent">{p.title}</Link>
                <p className="truncate text-xs text-subtle">/{p.slug}{p.category ? ` · ${p.category}` : ""}</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <FlagToggle entity="projects" id={p.id} flag="isPublished" value={p.isPublished} label={p.isPublished ? "Published" : "Draft"} disabled={!canPublish} />
                <FlagToggle entity="projects" id={p.id} flag="isFeatured" value={p.isFeatured} label="Featured" disabled={!canPublish} />
                <FlagToggle entity="projects" id={p.id} flag="isPinned" value={p.isPinned} label="Pinned" disabled={!canPublish} />
              </div>
            </div>
          )}
        />
      ) : (
        <EmptyState title="No projects yet">Create your first case study.</EmptyState>
      )}
    </>
  );
}
