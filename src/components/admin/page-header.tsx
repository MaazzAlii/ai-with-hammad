import Link from "next/link";

export function AdminPageHeader({
  title,
  description,
  actions,
  breadcrumbs,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  breadcrumbs?: { href: string; label: string }[];
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {breadcrumbs?.length ? (
          <nav aria-label="Breadcrumb" className="mb-2 text-sm text-subtle">
            {breadcrumbs.map((b, i) => (
              <span key={b.href}>
                {i > 0 ? <span aria-hidden> / </span> : null}
                <Link href={b.href} className="hover:text-fg">{b.label}</Link>
              </span>
            ))}
          </nav>
        ) : null}
        <h1 className="truncate text-2xl font-semibold">{title}</h1>
        {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function StatusBadges({ isPublished, isFeatured, isPinned, deleted }: { isPublished?: boolean; isFeatured?: boolean; isPinned?: boolean; deleted?: boolean }) {
  return (
    <span className="flex flex-wrap gap-1.5">
      {deleted ? <span className="rounded-full border border-danger/30 bg-danger-soft px-2 py-0.5 text-xs text-danger">Deleted</span> : null}
      <span className={isPublished ? "rounded-full border border-success/30 bg-success-soft px-2 py-0.5 text-xs text-success" : "rounded-full border border-border-strong px-2 py-0.5 text-xs text-muted"}>
        {isPublished ? "Published" : "Draft"}
      </span>
      {isFeatured ? <span className="rounded-full border border-accent/30 bg-accent-soft px-2 py-0.5 text-xs text-accent">Featured</span> : null}
      {isPinned ? <span className="rounded-full border border-warning/30 bg-warning-soft px-2 py-0.5 text-xs text-warning">Pinned</span> : null}
    </span>
  );
}
