import { Plus } from "lucide-react";
import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/site/section";
import { buttonVariants } from "@/components/ui/button";
import { Table, Td, Th } from "@/components/ui/misc";
import { can, requirePagePermission } from "@/server/auth/session";
import { listClientsAdmin } from "@/server/dal/portal";

export const metadata = { title: "Clients" };

export default async function ClientsPage() {
  const staff = await requirePagePermission("clients.read");
  const rows = await listClientsAdmin();
  return (
    <>
      <AdminPageHeader
        title="Clients"
        description="Client accounts for the private portal (messages and feedback). Day-to-day chat can stay on WhatsApp."
        actions={can(staff, "clients.manage") ? <Link href="/admin/clients/new" className={buttonVariants()}><Plus /> New client</Link> : null}
      />
      {rows.length ? (
        <Table>
          <thead><tr><Th>Client</Th><Th>Contact</Th><Th>Portal users</Th><Th>Open conversations</Th><Th>Status</Th></tr></thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id}>
                <Td><Link href={`/admin/clients/${c.id}`} className="font-medium hover:text-accent">{c.companyName}</Link></Td>
                <Td className="text-muted">{c.contactName || c.email || "—"}</Td>
                <Td>{c.users}</Td>
                <Td>{c.openThreads}</Td>
                <Td>{c.isActive ? <span className="text-success">Active</span> : <span className="text-subtle">Inactive</span>}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : <EmptyState title="No clients yet">Create a client, then invite their contacts to the portal.</EmptyState>}
    </>
  );
}
