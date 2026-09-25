import Link from "next/link";

import type { TeamMemberDTO } from "@/server/dal/public/team";

import { MediaImage, MediaPlaceholder } from "./media-image";

export function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("");
}

export function TeamCard({ member, compact = false }: { member: TeamMemberDTO; compact?: boolean }) {
  const ratio = compact ? "1/1" : "4/3";
  return (
    <article className="group relative">
      <div className="transition-transform duration-(--duration-slow) ease-spring group-active:scale-[0.985]">
        {member.photo ? (
          <MediaImage
            media={member.photo}
            alt={member.photo.alt || `Portrait of ${member.name}`}
            ratio={ratio}
            sizes="(min-width: 1024px) 25vw, 50vw"
            className="shadow-card"
            imgClassName="transition-transform duration-700 ease-out-soft group-hover:scale-[1.03]"
          />
        ) : (
          <MediaPlaceholder label={initials(member.name)} ratio={ratio} />
        )}
      </div>
      <h3 className="mt-3.5 text-base font-semibold tracking-tight text-fg">
        <Link href={`/team/${member.slug}`} className="after:absolute after:inset-0 after:rounded-media">
          {member.name}
        </Link>
      </h3>
      {member.roleTitle ? <p className="text-sm text-muted">{member.roleTitle}</p> : null}
      {!compact && member.bio ? <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">{member.bio}</p> : null}
    </article>
  );
}
