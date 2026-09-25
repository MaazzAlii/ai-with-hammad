import { notFound } from "next/navigation";

import { AutoRefresh } from "@/components/portal/auto-refresh";
import { Composer } from "@/components/portal/composer";
import { ThreadView } from "@/components/portal/thread-view";
import { Breadcrumb } from "@/components/site/section";
import { Badge } from "@/components/ui/badge";
import { markClientThreadRead, sendClientMessage } from "@/server/actions/portal";
import { requireClient } from "@/server/auth/client-session";
import { getThread } from "@/server/dal/portal";
import { getPublicSettings } from "@/server/dal/public/site";

export const metadata = { title: "Conversation" };

export default async function PortalThreadPage(props: PageProps<"/portal/messages/[id]">) {
  const { id } = await props.params;
  const user = await requireClient();
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const [data, { general }] = await Promise.all([getThread(id, user.clientId), getPublicSettings()]);
  if (!data) notFound();
  await markClientThreadRead(id);
  return (
    <div className="mx-auto max-w-3xl">
      <Breadcrumb href="/portal" label="Conversations" current={data.thread.subject} />
      <h1 className="text-[1.75rem] sm:text-[2rem]">{data.thread.subject}</h1>
      <Badge className="mt-3 capitalize">{data.thread.status}</Badge>
      <div className="mt-8">
        <ThreadView messages={data.messages} viewer="client" teamLabel={general.siteName} />
      </div>
      <div className="glass-panel sticky bottom-[max(1rem,env(safe-area-inset-bottom))] mt-8 rounded-[1.5rem] p-3 sm:bottom-6 sm:p-4">
        <Composer action={sendClientMessage.bind(null, id)} placeholder="Reply to the team…" />
      </div>
      <AutoRefresh intervalMs={15000} />
    </div>
  );
}
