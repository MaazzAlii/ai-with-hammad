import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Page section. Sections are separated by space, not rules — the page reads
 * as one continuous surface. `tight` halves the vertical rhythm.
 */
export function Section({ className, children, tight = false, ...props }: React.ComponentProps<"section"> & { tight?: boolean }) {
  return (
    <section className={cn(tight ? "py-8 sm:py-12" : "py-14 sm:py-20", className)} {...props}>
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
    <div data-reveal="item" className="mb-10 flex flex-col gap-5 sm:mb-12 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        {eyebrow ? <p className="eyebrow mb-2.5">{eyebrow}</p> : null}
        <Tag id={id} className={cn("text-fg", Tag === "h1" ? "text-[2.25rem] sm:text-5xl" : "text-[1.75rem] sm:text-[2.5rem]")}>
          {title}
        </Tag>
        {description ? <p className="mt-3 max-w-xl text-[1.0625rem] leading-relaxed text-muted">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

/** Secondary "see everything" action next to a section heading. */
export function ViewAllLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className={buttonVariants({ variant: "secondary", size: "sm", className: "group/va" })}>
      {children}
      <ArrowRight aria-hidden className="transition-transform duration-(--duration-base) ease-spring group-hover/va:translate-x-0.5" />
    </Link>
  );
}

/** Top of an inner page: breadcrumb/eyebrow, title, one-sentence description. */
export function PageHeader({
  eyebrow,
  title,
  description,
  breadcrumb,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  breadcrumb?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <header className="container-page pt-12 pb-4 sm:pt-20 sm:pb-8">
      {breadcrumb}
      {eyebrow && !breadcrumb ? <p className="eyebrow mb-3">{eyebrow}</p> : null}
      <h1 className="max-w-3xl text-[2.5rem] text-fg sm:text-6xl">{title}</h1>
      {description ? <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted sm:text-xl">{description}</p> : null}
      {children}
    </header>
  );
}

/** Back-link style breadcrumb (iOS navigation-bar pattern): "‹ Projects". */
export function Breadcrumb({ href, label, current }: { href: string; label: string; current: string }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex min-w-0 items-center gap-1.5 text-sm">
        <li>
          <Link href={href} className="group inline-flex items-center gap-1 font-medium text-accent">
            <svg aria-hidden viewBox="0 0 16 16" className="size-4 transition-transform duration-(--duration-base) ease-spring group-hover:-translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="m10 3.5-4.5 4.5 4.5 4.5" />
            </svg>
            {label}
          </Link>
        </li>
        <li aria-hidden className="text-subtle/70">/</li>
        <li aria-current="page" className="min-w-0 truncate text-subtle">
          {current}
        </li>
      </ol>
    </nav>
  );
}

export function EmptyState({ title, icon, children }: { title: string; icon?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="glass-card flex flex-col items-center rounded-card px-6 py-16 text-center">
      {icon ? <span className="mb-5 grid size-12 place-items-center rounded-2xl bg-fg/[0.05] text-subtle [&_svg]:size-6">{icon}</span> : null}
      <p className="text-lg font-semibold tracking-tight text-fg">{title}</p>
      {children ? <div className="mt-2 max-w-sm text-sm leading-relaxed text-muted">{children}</div> : null}
    </div>
  );
}
