import { ClientForm } from "@/components/admin/client-form";
import { AdminPageHeader } from "@/components/admin/page-header";
import { saveClient } from "@/server/actions/clients";
import { requirePagePermission } from "@/server/auth/session";

export const metadata = { title: "New client" };

export default async function NewClientPage() {
  await requirePagePermission("clients.manage");
  return (
    <>
      <AdminPageHeader title="New client" breadcrumbs={[{ href: "/admin/clients", label: "Clients" }]} />
      <div className="max-w-3xl">
        <ClientForm action={saveClient.bind(null, null)} canWrite />
      </div>
    </>
  );
}
