import { ArrowUpRight, Pin } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Tilt } from "@/components/ui/tilt";
import type { ProjectCardDTO } from "@/server/dal/public/projects";

import { MediaImage, MediaPlaceholder } from "./media-image";

export function ProjectCard({ project, priority = false, headingLevel = 3 }: { project: ProjectCardDTO; priority?: boolean; headingLevel?: 2 | 3 }) {
  const H = headingLevel === 2 ? "h2" : "h3";
  const techs = project.tags.filter((t) => t.kind === "technology").slice(0, 3);
  return (
    <article data-tilt-root className="group relative flex h-full flex-col">
      <div className="relative transition-transform duration-(--duration-slow) ease-spring group-active:scale-[0.985]">
        <Tilt className="rounded-media">
        {project.cover ? (
          <MediaImage
            media={project.cover}
            alt={project.cover.alt || project.title}
            ratio="4/3"
            priority={priority}
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="shadow-card transition-shadow duration-(--duration-slow) group-hover:shadow-panel"
            imgClassName="transition-transform duration-700 ease-out-soft group-hover:scale-[1.03]"
          />
        ) : (
          <MediaPlaceholder label={project.title.charAt(0)} ratio="4/3" />
        )}
        </Tilt>
        {project.isFeatured || project.isPinned ? (
          <div className="absolute top-3 left-3 flex gap-1.5">
            {project.isFeatured ? <Badge variant="glass">Featured</Badge> : null}
            {project.isPinned ? (
              <Badge variant="glass">
                <Pin aria-hidden /> Selected
              </Badge>
            ) : null}
          </div>
        ) : null}
        <span aria-hidden className="glass-float absolute right-3 bottom-3 grid size-9 place-items-center rounded-full text-fg opacity-0 transition-[opacity,translate] duration-(--duration-base) ease-spring group-hover:opacity-100 [@media(hover:hover)]:translate-y-1 group-hover:translate-y-0">
          <ArrowUpRight className="size-4" />
        </span>
      </div>
      <div className="mt-4 flex flex-1 flex-col px-0.5">
        {project.category ? <p className="mb-1 text-[0.8125rem] font-medium text-subtle">{project.category}</p> : null}
        <H className="text-[1.125rem] font-semibold tracking-tight text-fg">
          <Link href={`/projects/${project.slug}`} className="after:absolute after:inset-0 after:rounded-media">
            {project.title}
          </Link>
        </H>
        {project.summary ? <p className="mt-1.5 line-clamp-2 text-[0.9375rem] leading-relaxed text-muted">{project.summary}</p> : null}
        {techs.length ? (
          <ul className="mt-3.5 flex flex-wrap gap-1.5" aria-label="Technologies">
            {techs.map((t) => (
              <li key={t.slug}>
                <Badge>{t.label}</Badge>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </article>
  );
}
