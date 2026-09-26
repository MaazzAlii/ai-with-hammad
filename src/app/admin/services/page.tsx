import { Plus } from "lucide-react";
import Link from "next/link";

import { EntityRow } from "@/components/admin/entity-row";
import { AdminPageHeader } from "@/components/admin/page-header";
import { SortableList } from "@/components/admin/sortable-list";
import { EmptyState } from "@/components/site/section";
import { buttonVariants } from "@/components/ui/button";
import { reorder } from "@/server/actions/cms-common";
import { can, requirePagePermission } from "@/server/auth/session";
import { listServicesAdmin } from "@/server/dal/admin/cms";

export const metadata = { title: "Services" };

export default async function ServicesAdminPage() {
  const staff = await requirePagePermission("cms.read");
  const rows = await listServicesAdmin();
  const canPublish = can(staff, "services.publish");
  const canDelete = can(staff, "services.delete");
  return (
    <>
      <AdminPageHeader title="Services" description="Drag to change the order on the website." actions={can(staff, "services.write") ? <Link href="/admin/services/new" className={buttonVariants()}><Plus /> New service</Link> : null} />
      {rows.length ? (
        <SortableList
          disabled={!canPublish}
          onReorder={async (ids) => {
            "use server";
            return reorder("services", ids);
          }}
          items={rows.map((s) => ({
            id: s.id,
            content: <EntityRow href={`/admin/services/${s.id}`} title={s.title} meta={`/services/${s.slug}`} thumb={false} entity="services" id={s.id} canPublish={canPublish} canDelete={canDelete} label="service" flags={[{ flag: "isPublished", value: s.isPublished, label: "Published", offLabel: "Draft" }, { flag: "isFeatured", value: s.isFeatured, label: "Featured" }]} />,
          }))}
        />
      ) : <EmptyState title="No services yet" />}
    </>
  );
}
