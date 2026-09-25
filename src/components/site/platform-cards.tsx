import { ArrowUpRight } from "lucide-react";

import { formatCompactNumber, formatDate } from "@/lib/utils";
import { PLATFORM_LABELS, type PlatformDTO } from "@/server/dal/public/content";

/** Platform profiles. Follower counts are manual values shown with their "as of" date. */
export function PlatformCards({ platforms }: { platforms: PlatformDTO[] }) {
  if (!platforms.length) return null;
  return (
    <ul data-reveal="group" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {platforms.map((p) => (
        <li key={`${p.platform}-${p.handle}`} className="print-avoid">
          <a href={p.profileUrl} target="_blank" rel="noopener noreferrer me" className="group glass-card lift flex h-full flex-col rounded-card p-6">
            <span className="flex items-center justify-between">
              <span className="text-[0.8125rem] font-medium text-subtle">{PLATFORM_LABELS[p.platform]}</span>
              <ArrowUpRight aria-hidden className="size-4 text-subtle transition-[translate,color] duration-(--duration-base) ease-spring group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-accent" />
            </span>
            <span className="mt-3 text-lg font-semibold tracking-tight text-fg">{p.displayName || `@${p.handle.replace(/^@/, "")}`}</span>
            {p.displayName ? <span className="text-sm text-muted">@{p.handle.replace(/^@/, "")}</span> : null}
            {p.description ? <span className="mt-2 text-sm leading-relaxed text-muted">{p.description}</span> : null}
            {p.followers != null ? (
              <span className="mt-auto pt-6 text-sm text-muted">
                <span className="block text-[2rem] leading-none font-semibold tracking-tight text-fg tabular-nums">{formatCompactNumber(p.followers)}</span>
                <span className="mt-1.5 block">
                  followers{p.followersUpdatedAt ? <span className="text-subtle"> · as of {formatDate(p.followersUpdatedAt)}</span> : null}
                </span>
              </span>
            ) : null}
          </a>
        </li>
      ))}
    </ul>
  );
}
