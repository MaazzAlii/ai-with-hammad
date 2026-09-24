import { AdminPageHeader } from "@/components/admin/page-header";
import { PartnerForm } from "@/components/admin/sponsorship-forms";
import { savePartner } from "@/server/actions/sponsorship";
import { can, requirePagePermission } from "@/server/auth/session";

export const metadata = { title: "New partner" };

export default async function NewPartnerPage() {
  const staff = await requirePagePermission("sponsorship.write");
  return (
    <>
      <AdminPageHeader title="New partner" breadcrumbs={[{ href: "/admin/sponsorship", label: "Sponsorship" }]} />
      <PartnerForm action={savePartner.bind(null, null)} canWrite canPublish={can(staff, "sponsorship.publish")} />
    </>
  );
}
