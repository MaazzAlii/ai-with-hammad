import { AdminPageHeader } from "@/components/admin/page-header";
import { PackageForm } from "@/components/admin/sponsorship-forms";
import { savePackage } from "@/server/actions/sponsorship";
import { can, requirePagePermission } from "@/server/auth/session";

export const metadata = { title: "New package" };

export default async function NewPackagePage() {
  const staff = await requirePagePermission("sponsorship.write");
  return (
    <>
      <AdminPageHeader title="New package" breadcrumbs={[{ href: "/admin/sponsorship", label: "Sponsorship" }]} />
      <PackageForm action={savePackage.bind(null, null)} canWrite canPublish={can(staff, "sponsorship.publish")} />
    </>
  );
}
