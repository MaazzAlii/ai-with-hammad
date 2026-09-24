import Link from "next/link";
import { notFound } from "next/navigation";

import { AutoRefresh } from "@/components/portal/auto-refresh";
import { Composer } from "@/components/portal/composer";
import { ThreadView } from "@/components/portal/thread-view";
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
      <nav aria-label="Breadcrumb" className="mb-2 text-sm text-subtle">
        <Link href="/portal" className="hover:text-fg">Conversations</Link>
      </nav>
      <h1 className="text-2xl font-semibold">{data.thread.subject}</h1>
      <p className="mt-1 text-sm text-subtle capitalize">{data.thread.status}</p>
      <div className="mt-8">
        <ThreadView messages={data.messages} viewer="client" teamLabel={general.siteName} />
      </div>
      <div className="mt-8 rounded-card border border-border bg-surface/60 p-4">
        <Composer action={sendClientMessage.bind(null, id)} placeholder="Reply to the team…" />
      </div>
      <AutoRefresh intervalMs={15000} />
    </div>
  );
}
