import Link from "next/link";
import { notFound } from "next/navigation";

import { ActionButton } from "@/components/admin/confirm-action";
import { AdminPageHeader } from "@/components/admin/page-header";
import { AutoRefresh } from "@/components/portal/auto-refresh";
import { Composer } from "@/components/portal/composer";
import { ThreadView } from "@/components/portal/thread-view";
import { markThreadReadByStaff, setThreadStatus, staffReply } from "@/server/actions/messages";
import { can, requirePagePermission } from "@/server/auth/session";
import { getThread } from "@/server/dal/portal";

export const metadata = { title: "Conversation" };

export default async function AdminThreadPage(props: PageProps<"/admin/messages/[id]">) {
  const { id } = await props.params;
  const staff = await requirePagePermission("messages.read");
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const data = await getThread(id, null);
  if (!data) notFound();
  await markThreadReadByStaff(id);
  const canWrite = can(staff, "messages.write");
  const next = data.thread.status === "open" ? "closed" : "open";
  return (
    <>
      <AdminPageHeader
        title={data.thread.subject}
        description={`${data.thread.companyName} · ${data.thread.status}`}
        breadcrumbs={[{ href: "/admin/messages", label: "Messages" }]}
        actions={
          <>
            <Link href={`/admin/clients/${data.thread.clientId}`} className="text-sm text-accent hover:underline">Client profile</Link>
            {canWrite ? (
              <ActionButton
                size="sm"
                variant="secondary"
                action={async () => {
                  "use server";
                  return setThreadStatus(id, next);
                }}
              >
                {next === "closed" ? "Mark resolved" : "Reopen"}
              </ActionButton>
            ) : null}
          </>
        }
      />
      <div className="mx-auto max-w-3xl">
        <ThreadView messages={data.messages} viewer="staff" />
        {canWrite ? (
          <div className="mt-8 rounded-card border border-border bg-surface/60 p-4">
            <Composer action={staffReply.bind(null, id)} placeholder={`Reply to ${data.thread.companyName}…`} />
          </div>
        ) : null}
      </div>
      <AutoRefresh intervalMs={15000} />
    </>
  );
}
