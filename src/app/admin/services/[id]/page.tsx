import { notFound } from "next/navigation";

import { DeleteEntityButton } from "@/components/admin/delete-button";
import { AdminPageHeader, StatusBadges } from "@/components/admin/page-header";
import { ServiceForm } from "@/components/admin/service-form";
import { updateService } from "@/server/actions/services";
import { can, requirePagePermission } from "@/server/auth/session";
import { getServiceForEdit } from "@/server/dal/admin/cms";

export const metadata = { title: "Edit service" };

export default async function EditServicePage(props: PageProps<"/admin/services/[id]">) {
  const { id } = await props.params;
  const staff = await requirePagePermission("cms.read");
  const data = /^[0-9a-f-]{36}$/.test(id) ? await getServiceForEdit(id) : null;
  if (!data) notFound();
  return (
    <>
      <AdminPageHeader
        title={data.service.title}
        breadcrumbs={[{ href: "/admin/services", label: "Services" }]}
        actions={
          <>
            <StatusBadges isPublished={data.service.isPublished} isFeatured={data.service.isFeatured} />
            {can(staff, "services.delete") ? <DeleteEntityButton entity="services" id={id} redirectTo="/admin/services" label="service" /> : null}
          </>
        }
      />
      <ServiceForm action={updateService.bind(null, id)} data={data} canWrite={can(staff, "services.write")} canPublish={can(staff, "services.publish")} />
    </>
  );
}
