import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/page-header";
import { AutoRefresh } from "@/components/portal/auto-refresh";
import { EmptyState } from "@/components/site/section";
import { cn, formatDate } from "@/lib/utils";
import { requirePagePermission } from "@/server/auth/session";
import { listInboxThreads } from "@/server/dal/portal";

export const metadata = { title: "Messages" };

export default async function InboxPage(props: PageProps<"/admin/messages">) {
  await requirePagePermission("messages.read");
  const sp = await props.searchParams;
  const status = sp.status === "open" || sp.status === "closed" ? sp.status : undefined;
  const unreadOnly = sp.unread === "1";
  const threads = await listInboxThreads({ status, unreadOnly });
  const tab = (label: string, href: string, active: boolean) => (
    <Link href={href} aria-current={active ? "page" : undefined} className={cn("rounded-full border px-3 py-1.5 text-sm", active ? "border-accent bg-accent-soft text-accent" : "border-border-strong text-muted hover:text-fg")}>{label}</Link>
  );
  return (
    <>
      <AdminPageHeader title="Messages" description="Client portal conversations. Everyone on the team with message access can read and reply." />
      <nav aria-label="Filter" className="mb-6 flex flex-wrap gap-2">
        {tab("All", "/admin/messages", !status && !unreadOnly)}
        {tab("Unread", "/admin/messages?unread=1", unreadOnly)}
        {tab("Open", "/admin/messages?status=open", status === "open")}
        {tab("Closed", "/admin/messages?status=closed", status === "closed")}
      </nav>
      {threads.length ? (
        <ul className="divide-y divide-(--glass-line) overflow-hidden glass-card rounded-card">
          {threads.map((t) => (
            <li key={t.id}>
              <Link href={`/admin/messages/${t.id}`} className="flex items-start justify-between gap-4 px-5 py-4 hover:bg-surface-2">
                <span className="min-w-0">
                  <span className="flex items-center gap-2">
                    {t.unread ? <span aria-label="Unread" className="size-2 shrink-0 rounded-full bg-accent" /> : null}
                    <span className={cn("truncate", t.unread && "font-semibold")}>{t.subject}</span>
                  </span>
                  <span className="block truncate text-xs text-subtle">{t.companyName} — {t.preview}</span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1 text-xs text-subtle">
                  {formatDate(t.lastMessageAt, { hour: "2-digit", minute: "2-digit" })}
                  <span className="capitalize">{t.status}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : <EmptyState title="No conversations" />}
      <AutoRefresh intervalMs={30000} />
    </>
  );
}
