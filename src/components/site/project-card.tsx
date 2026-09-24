import { ArrowUpRight, Pin } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import type { ProjectCardDTO } from "@/server/dal/public/projects";

import { MediaImage } from "./media-image";

export function ProjectCard({ project, priority = false, headingLevel = 3 }: { project: ProjectCardDTO; priority?: boolean; headingLevel?: 2 | 3 }) {
  const H = headingLevel === 2 ? "h2" : "h3";
  const techs = project.tags.filter((t) => t.kind === "technology").slice(0, 4);
  return (
    <article className="group relative flex flex-col">
      <div className="relative">
        {project.cover ? (
          <MediaImage
            media={project.cover}
            alt={project.cover.alt || project.title}
            ratio="16/9"
            priority={priority}
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            imgClassName="transition-transform duration-500 ease-out-soft group-hover:scale-[1.03]"
          />
        ) : (
          <div className="grid aspect-video place-items-center rounded-media border border-border bg-linear-to-br from-surface-2 to-surface-3">
            <span className="font-display text-2xl font-semibold text-subtle">{project.title.charAt(0)}</span>
          </div>
        )}
        {project.isFeatured || project.isPinned ? (
          <div className="absolute top-3 left-3 flex gap-2">
            {project.isFeatured ? <Badge variant="accent" className="bg-bg/80 backdrop-blur">Featured</Badge> : null}
            {project.isPinned ? (
              <Badge className="bg-bg/80 backdrop-blur">
                <Pin aria-hidden /> Selected
              </Badge>
            ) : null}
          </div>
        ) : null}
      </div>
      <div className="mt-4 flex flex-1 flex-col">
        {project.category ? <p className="eyebrow mb-2">{project.category}</p> : null}
        <H className="text-lg font-semibold text-fg">
          <Link href={`/projects/${project.slug}`} className="after:absolute after:inset-0 after:rounded-media hover:text-accent">
            {project.title}
            <ArrowUpRight aria-hidden className="ml-1 inline size-4 opacity-0 transition-opacity group-hover:opacity-100" />
          </Link>
        </H>
        {project.summary ? <p className="mt-2 line-clamp-3 text-sm text-muted">{project.summary}</p> : null}
        {techs.length ? (
          <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Technologies">
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
