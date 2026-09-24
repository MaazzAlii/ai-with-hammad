import { cn } from "@/lib/utils";

export function Section({ className, children, ...props }: React.ComponentProps<"section">) {
  return (
    <section className={cn("py-14 sm:py-20", className)} {...props}>
      <div className="container-page">{children}</div>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  id,
  action,
  as: Tag = "h2",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  id?: string;
  action?: React.ReactNode;
  as?: "h1" | "h2";
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        {eyebrow ? <p className="eyebrow mb-3">{eyebrow}</p> : null}
        <Tag id={id} className={cn("font-semibold text-fg", Tag === "h1" ? "text-3xl sm:text-5xl" : "text-2xl sm:text-3xl")}>
          {title}
        </Tag>
        {description ? <p className="mt-3 text-muted sm:text-lg">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function PageHeader({ eyebrow, title, description, children }: { eyebrow?: string; title: string; description?: string; children?: React.ReactNode }) {
  return (
    <header className="relative overflow-hidden border-b border-border">
      <div aria-hidden className="bg-grid absolute inset-0" />
      <div className="container-page relative py-14 sm:py-20">
        {eyebrow ? <p className="eyebrow mb-4">{eyebrow}</p> : null}
        <h1 className="max-w-3xl text-3xl font-semibold text-fg sm:text-5xl">{title}</h1>
        {description ? <p className="mt-4 max-w-2xl text-muted sm:text-lg">{description}</p> : null}
        {children}
      </div>
    </header>
  );
}

export function EmptyState({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-card border border-dashed border-border-strong bg-surface/50 px-6 py-12 text-center">
      <p className="font-display text-lg font-semibold text-fg">{title}</p>
      {children ? <div className="mt-2 text-sm text-muted">{children}</div> : null}
    </div>
  );
}
