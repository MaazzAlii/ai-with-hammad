import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminForm } from "@/components/admin/admin-form";
import { ClientForm } from "@/components/admin/client-form";
import { ActionButton } from "@/components/admin/confirm-action";
import { FormSection, TextAreaField, TextField } from "@/components/admin/fields";
import { AdminPageHeader } from "@/components/admin/page-header";
import { formatDate } from "@/lib/utils";
import { inviteClientUser, saveClient, setClientUserActive } from "@/server/actions/clients";
import { startThreadWithClient } from "@/server/actions/messages";
import { can, requirePagePermission } from "@/server/auth/session";
import { getClientAdmin, listInboxThreads } from "@/server/dal/portal";

export const metadata = { title: "Client" };

export default async function ClientDetailPage(props: PageProps<"/admin/clients/[id]">) {
  const { id } = await props.params;
  const staff = await requirePagePermission("clients.read");
  const data = /^[0-9a-f-]{36}$/.test(id) ? await getClientAdmin(id) : null;
  if (!data) notFound();
  const threads = can(staff, "messages.read") ? await listInboxThreads({ clientId: id }) : [];
  const canManage = can(staff, "clients.manage");
  return (
    <>
      <AdminPageHeader title={data.client.companyName} breadcrumbs={[{ href: "/admin/clients", label: "Clients" }]} />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-6">
          <ClientForm action={saveClient.bind(null, id)} client={data.client} canWrite={canManage} />
          {can(staff, "messages.read") ? (
            <section>
              <h2 className="mb-3 font-semibold">Conversations</h2>
              {threads.length ? (
                <ul className="divide-y divide-(--glass-line) glass-card rounded-card">
                  {threads.map((t) => (
                    <li key={t.id}>
                      <Link href={`/admin/messages/${t.id}`} className="flex justify-between gap-3 px-4 py-3 hover:bg-surface-2">
                        <span className="truncate">{t.subject}</span>
                        <span className="shrink-0 text-xs text-subtle">{formatDate(t.lastMessageAt)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-sm text-muted">No conversations yet.</p>}
              {can(staff, "messages.write") ? (
                <div className="mt-4">
                  <AdminForm action={startThreadWithClient.bind(null, id)} submitLabel="Start conversation" compact>
                    <FormSection title="Message this client">
                      <TextField name="subject" label="Subject" required />
                      <TextAreaField name="body" label="Message" rows={4} required />
                    </FormSection>
                  </AdminForm>
                </div>
              ) : null}
            </section>
          ) : null}
        </div>
        <aside className="space-y-6">
          <section className="glass-card rounded-card p-5">
            <h2 className="font-semibold">Portal users</h2>
            {data.users.length ? (
              <ul className="mt-3 space-y-3">
                {data.users.map((u) => (
                  <li key={u.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="min-w-0">
                      <span className="block truncate">{u.fullName || u.email}</span>
                      <span className="block truncate text-xs text-subtle">{u.email} · {u.lastSignInAt ? `last in ${formatDate(u.lastSignInAt)}` : "never signed in"}</span>
                    </span>
                    {canManage ? (
                      <ActionButton
                        size="sm"
                        variant="ghost"
                        action={async () => {
                          "use server";
                          return setClientUserActive(u.id, !u.isActive);
                        }}
                      >
                        {u.isActive ? "Disable" : "Enable"}
                      </ActionButton>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : <p className="mt-2 text-sm text-muted">No portal users yet.</p>}
          </section>
          {canManage ? (
            <AdminForm action={inviteClientUser.bind(null, id)} submitLabel="Send portal invite" compact>
              <FormSection title="Invite to portal" description="They get an email link to set a password, then sign in at /portal/login.">
                <TextField name="email" label="Email" type="email" required />
                <TextField name="fullName" label="Name" />
              </FormSection>
            </AdminForm>
          ) : null}
        </aside>
      </div>
    </>
  );
}
