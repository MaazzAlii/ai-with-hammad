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
                "max-w-[85%] rounded-[1.35rem] px-4 py-3 motion-safe:animate-[step-in_320ms_var(--ease-spring)] sm:max-w-[70%]",
                mine ? "rounded-br-md bg-accent text-accent-fg shadow-card" : "glass-card rounded-bl-md",
              )}
            >
              <p className={cn("mb-1 text-xs", mine ? "text-accent-fg/75" : "text-subtle")}>
                <span className={cn("font-medium", mine ? "text-accent-fg" : "text-muted")}>{who}</span> · <time dateTime={m.createdAt.toISOString()}>{formatDate(m.createdAt, { hour: "2-digit", minute: "2-digit" })}</time>
              </p>
              <p className={cn("text-[0.9375rem] leading-relaxed break-words whitespace-pre-wrap", mine ? "text-accent-fg" : "text-fg")}>{m.body}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
