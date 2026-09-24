import { cn, formatDate } from "@/lib/utils";

type Msg = { id: string; body: string; authorKind: "staff" | "client"; createdAt: Date; authorName: string | null; authorEmail: string | null };

/** Chat-style conversation. `viewer` decides which side is "mine". Bodies render as plain text. */
export function ThreadView({ messages, viewer, teamLabel = "AI With Hamad team" }: { messages: Msg[]; viewer: "staff" | "client"; teamLabel?: string }) {
  return (
    <ol className="space-y-4" aria-label="Messages">
      {messages.map((m) => {
        const mine = m.authorKind === viewer;
        const who = m.authorKind === "staff" ? (viewer === "staff" ? m.authorName || m.authorEmail || "Team" : `${m.authorName || "Team"} · ${teamLabel}`) : m.authorName || m.authorEmail || "Client";
        return (
          <li key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[85%] rounded-card border px-4 py-3 sm:max-w-[70%]",
                mine ? "rounded-br-md border-accent/30 bg-accent-soft" : "rounded-bl-md border-border bg-surface",
              )}
            >
              <p className="mb-1 text-xs text-subtle">
                <span className="font-medium text-muted">{who}</span> · <time dateTime={m.createdAt.toISOString()}>{formatDate(m.createdAt, { hour: "2-digit", minute: "2-digit" })}</time>
              </p>
              <p className="text-sm break-words whitespace-pre-wrap text-fg">{m.body}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
