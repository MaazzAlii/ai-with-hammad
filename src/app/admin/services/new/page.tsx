import { AdminPageHeader } from "@/components/admin/page-header";
import { ServiceForm } from "@/components/admin/service-form";
import { createService } from "@/server/actions/services";
import { can, requirePagePermission } from "@/server/auth/session";

export const metadata = { title: "New service" };

export default async function NewServicePage() {
  const staff = await requirePagePermission("services.write");
  return (
    <>
      <AdminPageHeader title="New service" breadcrumbs={[{ href: "/admin/services", label: "Services" }]} />
      <ServiceForm action={createService} canWrite canPublish={can(staff, "services.publish")} />
    </>
  );
}
