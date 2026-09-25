import { Bot, Check, Database, Mail, UserCheck, Webhook, type LucideIcon } from "lucide-react";

/**
 * Decorative hero visual: one run of an AI agent, drawn as layered glass.
 * Pure HTML/CSS (no JS). It illustrates how the studio builds systems — it
 * deliberately shows no metrics, clients or numbers.
 */
const STEPS: { icon: LucideIcon; title: string; detail: string; state: "done" | "active" | "queued" }[] = [
  { icon: Webhook, title: "New lead received", detail: "Website form", state: "done" },
  { icon: Bot, title: "Qualified and summarised", detail: "Agent · guardrails on", state: "done" },
  { icon: Database, title: "CRM record updated", detail: "Tool call", state: "done" },
  { icon: UserCheck, title: "Reply drafted for review", detail: "Waiting for a person", state: "active" },
  { icon: Mail, title: "Send and log", detail: "After approval", state: "queued" },
];

export function AgentVisual() {
  return (
    <figure className="relative mx-auto w-full max-w-[30rem] select-none lg:mr-0">
      <div aria-hidden className="absolute -inset-x-4 -inset-y-10 -z-10 rounded-full bg-[radial-gradient(closest-side,var(--ambient-1),transparent)] blur-2xl" />

      <div aria-hidden className="glass-panel relative rounded-[1.75rem] p-2">
        <div className="flex items-center gap-3 px-3 pt-2.5 pb-3.5">
          <span className="grid size-9 place-items-center rounded-[0.7rem] bg-accent text-accent-fg shadow-[inset_0_1px_0_rgb(255_255_255/0.3)]">
            <Bot className="size-[1.1rem]" strokeWidth={2} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[0.9375rem] leading-tight font-semibold tracking-tight">Lead intake agent</p>
            <p className="text-xs text-subtle">Example run</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-2.5 py-1 text-xs font-medium text-success">
            <span className="size-1.5 rounded-full bg-current motion-safe:animate-[breathe_1.8s_ease-in-out_infinite]" />
            Running
          </span>
        </div>

        <ol className="rounded-[1.25rem] bg-surface/70 shadow-[inset_0_0_0_1px_var(--glass-line)] dark:bg-white/[0.03]">
          {STEPS.map((s, i) => (
            <li
              key={s.title}
              className="flex items-center gap-3 border-b border-(--glass-line) px-3.5 py-3 last:border-b-0 motion-safe:animate-[step-in_560ms_var(--ease-spring)_both]"
              style={{ animationDelay: `${250 + i * 140}ms` }}
            >
              <span className={`grid size-8 shrink-0 place-items-center rounded-full ${s.state === "queued" ? "bg-fg/[0.05] text-subtle" : "bg-accent-soft text-accent"}`}>
                <s.icon className="size-4" strokeWidth={1.8} />
              </span>
              <span className="min-w-0 flex-1">
                <span className={`block truncate text-sm font-medium ${s.state === "queued" ? "text-muted" : "text-fg"}`}>{s.title}</span>
                <span className="block truncate text-xs text-subtle">{s.detail}</span>
              </span>
              {s.state === "done" ? (
                <span className="grid size-5 place-items-center rounded-full bg-success text-white motion-safe:animate-[check-in_420ms_var(--ease-snap)_both]" style={{ animationDelay: `${520 + i * 140}ms` }}>
                  <Check className="size-3" strokeWidth={3} />
                </span>
              ) : s.state === "active" ? (
                <span className="size-5 rounded-full border-2 border-accent/25 border-t-accent motion-safe:animate-spin" />
              ) : (
                <span className="size-5 rounded-full border-2 border-fg/10" />
              )}
            </li>
          ))}
        </ol>
      </div>

      {/* A notification-style card floating over the panel: the human-in-the-loop moment. */}
      <div
        aria-hidden
        className="glass-sheet absolute -bottom-12 -left-2 w-[15rem] rounded-[1.25rem] p-3.5 motion-safe:animate-[step-in_600ms_var(--ease-spring)_both] sm:-left-10"
        style={{ animationDelay: "1.2s" }}
      >
        <p className="text-xs font-medium text-subtle">Needs your approval</p>
        <p className="mt-1 text-sm leading-snug font-medium text-fg">Reply to a new enquiry is ready to send.</p>
        <div className="mt-3 flex gap-2">
          <span className="flex h-8 flex-1 items-center justify-center rounded-full bg-accent text-xs font-medium text-accent-fg">Approve</span>
          <span className="flex h-8 flex-1 items-center justify-center rounded-full bg-fg/[0.06] text-xs font-medium text-fg">Edit</span>
        </div>
      </div>

      <figcaption className="sr-only">
        Illustration of an AI agent workflow: a lead arrives, an agent qualifies it and updates the CRM, a person approves the drafted reply, and the result is sent and logged.
      </figcaption>
    </figure>
  );
}
