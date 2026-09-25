import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";

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
          <nav aria-label="Breadcrumb" className="mb-2 flex flex-wrap items-center gap-1 text-sm">
            {breadcrumbs.map((b, i) => (
              <span key={b.href} className="inline-flex items-center gap-1">
                {i > 0 ? <ChevronRight aria-hidden className="size-3.5 text-subtle" /> : null}
                <Link href={b.href} className="font-medium text-accent hover:underline">{b.label}</Link>
              </span>
            ))}
          </nav>
        ) : null}
        <h1 className="truncate text-[1.75rem] sm:text-[2rem]">{title}</h1>
        {description ? <p className="mt-1.5 text-[0.9375rem] text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function StatusBadges({ isPublished, isFeatured, isPinned, deleted }: { isPublished?: boolean; isFeatured?: boolean; isPinned?: boolean; deleted?: boolean }) {
  return (
    <span className="flex flex-wrap gap-1.5">
      {deleted ? <Badge variant="danger">Deleted</Badge> : null}
      <Badge variant={isPublished ? "success" : "default"}>{isPublished ? "Published" : "Draft"}</Badge>
      {isFeatured ? <Badge variant="accent">Featured</Badge> : null}
      {isPinned ? <Badge variant="warning">Pinned</Badge> : null}
    </span>
  );
}
