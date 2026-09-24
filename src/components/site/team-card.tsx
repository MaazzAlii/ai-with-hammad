import Link from "next/link";

import type { TeamMemberDTO } from "@/server/dal/public/team";

import { MediaImage } from "./media-image";

export function TeamCard({ member, compact = false }: { member: TeamMemberDTO; compact?: boolean }) {
  return (
    <article className="group relative">
      {member.photo ? (
        <MediaImage media={member.photo} alt={member.photo.alt || `Portrait of ${member.name}`} ratio={compact ? "1/1" : "4/3"} sizes="(min-width: 1024px) 25vw, 50vw" imgClassName="transition-transform duration-500 group-hover:scale-[1.03]" />
      ) : (
        <div className={`grid place-items-center rounded-media border border-border bg-linear-to-br from-surface-2 to-surface-3 ${compact ? "aspect-square" : "aspect-[4/3]"}`}>
          <span aria-hidden className="font-display text-3xl font-semibold text-subtle">
            {member.name
              .split(/\s+/)
              .map((p) => p[0])
              .slice(0, 2)
              .join("")}
          </span>
        </div>
      )}
      <h3 className="mt-4 text-base font-semibold text-fg">
        <Link href={`/team/${member.slug}`} className="after:absolute after:inset-0 hover:text-accent">
          {member.name}
        </Link>
      </h3>
      {member.roleTitle ? <p className="text-sm text-accent-2">{member.roleTitle}</p> : null}
      {!compact && member.bio ? <p className="mt-2 line-clamp-3 text-sm text-muted">{member.bio}</p> : null}
    </article>
  );
}
