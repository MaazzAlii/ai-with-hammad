import { ChevronRight, MessageSquarePlus, MessagesSquare, Star } from "lucide-react";
import Link from "next/link";

import { AutoRefresh } from "@/components/portal/auto-refresh";
import { EmptyState } from "@/components/site/section";
import { Badge } from "@/components/ui/badge";
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
        <div className="mb-6 flex items-center justify-between gap-3">
          <h1 id="threads-title" className="text-[1.75rem] sm:text-[2rem]">Conversations</h1>
          <Link href="/portal/messages/new" className={buttonVariants({ size: "sm" })}><MessageSquarePlus /> New message</Link>
        </div>
        {threads.length ? (
          <ul className="glass-card divide-y divide-(--glass-line) overflow-hidden rounded-card">
            {threads.map((t) => (
              <li key={t.id}>
                <Link href={`/portal/messages/${t.id}`} className="flex min-h-16 items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-fg/[0.03] active:bg-fg/[0.05]">
                  <span className="min-w-0">
                    <span className={cn("flex items-center gap-2 truncate", t.unread ? "font-semibold text-fg" : "text-fg")}>{t.unread ? <span aria-hidden className="size-2 shrink-0 rounded-full bg-accent" /> : null}{t.subject}</span>
                    <span className="text-xs text-subtle">Last activity {formatDate(t.lastMessageAt, { hour: "2-digit", minute: "2-digit" })}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    {t.unread ? <Badge variant="accent">New reply</Badge> : null}
                    <Badge className="capitalize">{t.status}</Badge>
                    <ChevronRight aria-hidden className="size-4 text-subtle" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="No conversations yet" icon={<MessagesSquare />}>
            Send the team a message — we&apos;ll reply here.
          </EmptyState>
        )}
        <AutoRefresh intervalMs={30000} />
      </section>
      <aside className="space-y-4">
        <div className="glass-card rounded-card p-6">
          <h2 className="font-semibold tracking-tight">Share your feedback</h2>
          <p className="mt-1 text-sm text-muted">Finished a project with us? Rate the work and leave a testimonial.</p>
          <Link href="/portal/feedback" className={buttonVariants({ variant: "secondary", size: "sm", className: "mt-4" })}><Star /> Leave feedback</Link>
        </div>
        {wa || general.contactEmail ? (
          <div className="glass-card rounded-card p-6 text-sm">
            <h2 className="font-semibold tracking-tight">Quick questions</h2>
            <p className="mt-1 text-muted">Day-to-day coordination happens on WhatsApp.</p>
            {wa ? <a href={wa} target="_blank" rel="noopener noreferrer" className="mt-4 block font-medium text-accent hover:underline">Open WhatsApp chat</a> : null}
            {general.contactEmail ? <a href={`mailto:${general.contactEmail}`} className="mt-1 block text-accent hover:underline">{general.contactEmail}</a> : null}
          </div>
        ) : null}
      </aside>
    </div>
  );
}
