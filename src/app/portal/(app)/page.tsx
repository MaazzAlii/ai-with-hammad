import { MessageSquarePlus, Star } from "lucide-react";
import Link from "next/link";

import { AutoRefresh } from "@/components/portal/auto-refresh";
import { buttonVariants } from "@/components/ui/button";
import { cn, formatDate } from "@/lib/utils";
import { whatsappLink } from "@/lib/whatsapp";
import { requireClient } from "@/server/auth/client-session";
import { listClientThreads } from "@/server/dal/portal";
import { getPublicSettings } from "@/server/dal/public/site";

export const metadata = { title: "Conversations" };

export default async function PortalHome() {
  const user = await requireClient();
  const [threads, { general }] = await Promise.all([listClientThreads(user.clientId), getPublicSettings()]);
  const wa = whatsappLink(general.whatsapp, general.whatsappMessage);
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <section aria-labelledby="threads-title">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h1 id="threads-title" className="text-2xl font-semibold">Conversations</h1>
          <Link href="/portal/messages/new" className={buttonVariants({ size: "sm" })}><MessageSquarePlus /> New message</Link>
        </div>
        {threads.length ? (
          <ul className="divide-y divide-border overflow-hidden rounded-card border border-border bg-surface/60">
            {threads.map((t) => (
              <li key={t.id}>
                <Link href={`/portal/messages/${t.id}`} className="flex items-center justify-between gap-3 px-5 py-4 hover:bg-surface-2">
                  <span className="min-w-0">
                    <span className={cn("block truncate", t.unread ? "font-semibold text-fg" : "text-fg")}>{t.subject}</span>
                    <span className="text-xs text-subtle">Last activity {formatDate(t.lastMessageAt, { hour: "2-digit", minute: "2-digit" })}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    {t.unread ? <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-accent-fg">New reply</span> : null}
                    <span className="rounded-full border border-border-strong px-2 py-0.5 text-xs capitalize text-muted">{t.status}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-card border border-dashed border-border-strong p-10 text-center">
            <p className="font-semibold">No conversations yet</p>
            <p className="mt-1 text-sm text-muted">Send the team a message — we&apos;ll reply here.</p>
          </div>
        )}
        <AutoRefresh intervalMs={30000} />
      </section>
      <aside className="space-y-4">
        <div className="rounded-card border border-border bg-surface/60 p-5">
          <h2 className="font-semibold">Share your feedback</h2>
          <p className="mt-1 text-sm text-muted">Finished a project with us? Rate the work and leave a testimonial.</p>
          <Link href="/portal/feedback" className={buttonVariants({ variant: "secondary", size: "sm", className: "mt-4" })}><Star /> Leave feedback</Link>
        </div>
        {wa || general.contactEmail ? (
          <div className="rounded-card border border-border bg-surface/60 p-5 text-sm">
            <h2 className="font-semibold">Quick questions</h2>
            <p className="mt-1 text-muted">Day-to-day coordination happens on WhatsApp.</p>
            {wa ? <a href={wa} target="_blank" rel="noopener noreferrer" className="mt-3 block text-success hover:underline">Open WhatsApp chat</a> : null}
            {general.contactEmail ? <a href={`mailto:${general.contactEmail}`} className="mt-1 block text-accent hover:underline">{general.contactEmail}</a> : null}
          </div>
        ) : null}
      </aside>
    </div>
  );
}
