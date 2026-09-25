import { ExternalLink } from "lucide-react";

import { formatCompactNumber, formatDate } from "@/lib/utils";
import { PLATFORM_LABELS, type PlatformDTO } from "@/server/dal/public/content";

/** Platform profiles. Follower counts are manual values shown with their "as of" date. */
export function PlatformCards({ platforms }: { platforms: PlatformDTO[] }) {
  if (!platforms.length) return null;
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {platforms.map((p) => (
        <li key={`${p.platform}-${p.handle}`} className="print-avoid">
          <a href={p.profileUrl} target="_blank" rel="noopener noreferrer me" className="group flex h-full flex-col rounded-card border border-border bg-surface/60 p-5 transition-colors hover:border-accent/40">
            <span className="flex items-center justify-between">
              <span className="eyebrow">{PLATFORM_LABELS[p.platform]}</span>
              <ExternalLink aria-hidden className="size-4 text-subtle group-hover:text-accent" />
            </span>
            <span className="mt-3 font-display text-lg font-semibold text-fg">{p.displayName || `@${p.handle.replace(/^@/, "")}`}</span>
            {p.displayName ? <span className="text-sm text-muted">@{p.handle.replace(/^@/, "")}</span> : null}
            {p.description ? <span className="mt-2 text-sm text-muted">{p.description}</span> : null}
            {p.followers != null ? (
              <span className="mt-4 text-sm text-fg">
                <span className="font-mono text-2xl text-accent">{formatCompactNumber(p.followers)}</span> followers
                {p.followersUpdatedAt ? <span className="block text-xs text-subtle">as of {formatDate(p.followersUpdatedAt)}</span> : null}
              </span>
            ) : null}
          </a>
        </li>
      ))}
    </ul>
  );
}
