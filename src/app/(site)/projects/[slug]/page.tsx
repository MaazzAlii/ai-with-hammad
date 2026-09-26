import { ArrowRight, ArrowUpRight, Code2, FileText, Link2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/site/json-ld";
import { Markdown } from "@/components/site/markdown";
import { MediaGallery } from "@/components/site/media-gallery";
import { MediaImage } from "@/components/site/media-image";
import { ProjectCard } from "@/components/site/project-card";
import { Breadcrumb, PageHeader, Section, SectionHeading } from "@/components/site/section";
import { VideoEmbed } from "@/components/site/video-embed";
import { VideoPlayer } from "@/components/site/video-player";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { breadcrumbLd, creativeWorkLd, videoObjectLd } from "@/lib/jsonld";
import { markdownToText } from "@/lib/markdown";
import { buildMetadata } from "@/lib/seo";
import { getPublishedProject, listPublishedProjects, listRelatedProjects } from "@/server/dal/public/projects";

export const revalidate = 3600;

export async function generateStaticParams() {
  return (await listPublishedProjects()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(props: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const p = await getPublishedProject(slug);
  if (!p) return {};
  return buildMetadata({
    title: p.seoTitle || p.title,
    description: p.seoDescription || p.summary || markdownToText(p.overview),
    path: `/projects/${p.slug}`,
    image: p.cover,
    type: "article",
    publishedTime: p.publishedAt?.toISOString(),
    modifiedTime: p.updatedAt.toISOString(),
  });
}

const NARRATIVE = [
  ["overview", "Overview"],
  ["problem", "The problem"],
  ["approach", "Approach"],
  ["architecture", "Architecture"],
  ["implementation", "Implementation"],
  ["results", "Results"],
] as const;

export default async function ProjectPage(props: PageProps<"/projects/[slug]">) {
  const { slug } = await props.params;
  const project = await getPublishedProject(slug);
  if (!project) notFound();
  const related = await listRelatedProjects(project);

  const sections = NARRATIVE.filter(([key]) => project[key].trim());
  const images = project.media.filter((m) => m.kind === "image");
  const diagrams = images.filter((m) => m.type === "diagram");
  const screenshots = images.filter((m) => m.type !== "diagram");
  const videos = project.media.filter((m) => m.kind === "video" || m.kind === "embed");
  const docs = project.media.filter((m) => m.kind === "document" || m.kind === "link");
  const techs = project.tags.filter((t) => t.kind === "technology");
  const topics = project.tags.filter((t) => t.kind === "topic");
  const facts = [
    ["Client", project.clientName],
    ["Industry", project.industry],
    ["Year", project.projectYear ? String(project.projectYear) : ""],
    ["Category", project.category],
  ].filter(([, v]) => v);
  const toGallery = (list: typeof images) =>
    list.flatMap((m) =>
      m.kind === "image"
        ? [{ url: m.media.url, alt: m.alt || m.title || project.title, caption: m.caption, title: m.title, width: m.media.width, height: m.media.height, unoptimized: m.media.mimeType === "image/svg+xml" }]
        : [],
    );

  const firstVideo = videos[0];
  const videoLd =
    firstVideo?.kind === "embed" && (firstVideo.poster?.url || firstVideo.embed.thumbnailUrl)
      ? videoObjectLd({
          name: firstVideo.title || project.title,
          description: firstVideo.caption || project.summary,
          thumbnailUrl: (firstVideo.poster?.url || firstVideo.embed.thumbnailUrl)!,
          embedUrl: firstVideo.embed.embedUrl,
          uploadDate: (project.publishedAt ?? project.updatedAt).toISOString(),
        })
      : firstVideo?.kind === "video" && firstVideo.poster
        ? videoObjectLd({
            name: firstVideo.title || project.title,
            description: firstVideo.caption || project.summary,
            thumbnailUrl: firstVideo.poster.url,
            contentUrl: firstVideo.media.url,
            uploadDate: (project.publishedAt ?? project.updatedAt).toISOString(),
            durationSeconds: firstVideo.media.durationSeconds,
          })
        : null;

  return (
    <article>
      <PageHeader
        title={project.title}
        description={project.subtitle || project.summary || undefined}
        breadcrumb={
          <>
            <Breadcrumb href="/projects" label="Projects" current={project.title} />
            {project.category ? <p className="eyebrow mb-3">{project.category}</p> : null}
          </>
        }
      >
        {project.projectUrl || project.repositoryUrl ? (
          <div className="mt-8 flex flex-wrap gap-2.5">
            {project.projectUrl ? (
              <a href={project.projectUrl} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "secondary" })}>
                Visit project <ArrowUpRight aria-hidden />
              </a>
            ) : null}
            {project.repositoryUrl ? (
              <a href={project.repositoryUrl} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "ghost" })}>
                <Code2 aria-hidden /> Source
              </a>
            ) : null}
          </div>
        ) : null}
      </PageHeader>
      {project.cover ? (
        <div className="container-page mt-8 sm:mt-10">
          <div className="glass-panel rounded-[1.75rem] p-1.5 sm:p-2">
            <MediaImage media={project.cover} alt={project.cover.alt || project.title} priority className="rounded-[1.35rem]" sizes="(min-width: 1280px) 1200px, 100vw" />
          </div>
        </div>
      ) : null}

      <div className="container-page grid gap-12 py-14 sm:py-20 lg:grid-cols-[minmax(0,1fr)_17rem] lg:gap-16">
        <div className="min-w-0 space-y-16">
          {sections.map(([key, label]) => (
            <section key={key} aria-labelledby={`sec-${key}`} data-reveal="item">
              <h2 id={`sec-${key}`} className="mb-4 text-[1.625rem]">{label}</h2>
              <Markdown source={project[key]} />
              {key === "architecture" && diagrams.length ? <div className="mt-8"><MediaGallery images={toGallery(diagrams)} /></div> : null}
            </section>
          ))}

          {project.features.length ? (
            <section aria-labelledby="sec-features">
              <h2 id="sec-features" className="mb-6 text-[1.625rem]">Key features</h2>
              <ul data-reveal="group" className="focus-group grid gap-4 sm:grid-cols-2">
                {project.features.map((f) => (
                  <li key={f.title} className="glass-card rounded-card p-6">
                    <h3 className="font-semibold text-fg">{f.title}</h3>
                    {f.description ? <p className="mt-2 text-sm text-muted">{f.description}</p> : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {project.metrics.length ? (
            <section aria-labelledby="sec-metrics">
              <h2 id="sec-metrics" className="mb-6 text-[1.625rem]">Outcomes</h2>
              <dl data-reveal="group" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {project.metrics.map((m) => (
                  <div key={m.label} className="glass-panel flex flex-col-reverse rounded-card p-6">
                    <dt className="mt-3 text-sm font-medium text-fg">{m.label}{m.description ? <span className="mt-1 block text-xs font-normal text-muted">{m.description}</span> : null}</dt>
                    <dd className="text-[2.25rem] leading-none font-semibold tracking-tight text-fg tabular-nums">{m.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ) : null}

          {videos.length ? (
            <section aria-labelledby="sec-video" className="space-y-8">
              <h2 id="sec-video" className="text-[1.625rem]">Video</h2>
              {videos.map((v, i) => (
                <figure key={i}>
                  {v.kind === "embed" ? (
                    <VideoEmbed embed={v.embed} title={v.title || project.title} posterUrl={v.poster?.url} />
                  ) : v.kind === "video" ? (
                    <VideoPlayer src={v.media.url} mimeType={v.media.mimeType} poster={v.poster?.url} title={v.title || project.title} />
                  ) : null}
                  {v.caption ? <figcaption className="mt-2 text-sm text-muted">{v.caption}</figcaption> : null}
                </figure>
              ))}
            </section>
          ) : null}

          {screenshots.length ? (
            <section aria-labelledby="sec-gallery">
              <h2 id="sec-gallery" className="mb-6 text-[1.625rem]">Screenshots</h2>
              <MediaGallery images={toGallery(screenshots)} />
            </section>
          ) : null}

          {docs.length ? (
            <section aria-labelledby="sec-docs">
              <h2 id="sec-docs" className="mb-4 text-[1.625rem]">Resources</h2>
              <ul className="glass-card overflow-hidden rounded-card">
                {docs.map((d, i) => (
                  <li key={i} className="border-b border-(--glass-line) last:border-b-0">
                    <a
                      href={d.kind === "document" ? d.media.url : d.kind === "link" ? d.url : "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex min-h-13 items-center gap-3 px-5 py-3 transition-colors hover:bg-fg/[0.03]"
                    >
                      <span className="grid size-8 shrink-0 place-items-center rounded-[0.6rem] bg-accent-soft text-accent">{d.kind === "document" ? <FileText aria-hidden className="size-4" /> : <Link2 aria-hidden className="size-4" />}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium text-fg">{d.title || (d.kind === "link" ? d.url : "Document")}</span>
                        {d.caption ? <span className="block truncate text-sm text-muted">{d.caption}</span> : null}
                      </span>
                      <ArrowUpRight aria-hidden className="size-4 text-subtle transition-transform duration-(--duration-base) ease-spring group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        <aside className="space-y-8 lg:sticky lg:top-[calc(var(--header-h)+2rem)] lg:h-fit" aria-label="Project details">
          {facts.length ? (
            <dl className="glass-card divide-y divide-(--glass-line) rounded-card text-sm">
              {facts.map(([k, v]) => (
                <div key={k} className="flex items-baseline justify-between gap-4 px-5 py-3.5">
                  <dt className="text-muted">{k}</dt>
                  <dd className="text-right font-medium text-fg">{v}</dd>
                </div>
              ))}
            </dl>
          ) : null}
          {techs.length ? (
            <div>
              <h2 className="label-caps mb-3">Technology</h2>
              <ul className="flex flex-wrap gap-1.5">
                {techs.map((t) => (
                  <li key={t.slug}>
                    <Link href={`/projects?tech=${t.slug}`} className="pressable inline-block rounded-full"><Badge className="hover:bg-fg/10 hover:text-fg">{t.label}</Badge></Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {topics.length ? (
            <div>
              <h2 className="label-caps mb-3">Topics</h2>
              <ul className="flex flex-wrap gap-1.5">{topics.map((t) => <li key={t.slug}><Badge>{t.label}</Badge></li>)}</ul>
            </div>
          ) : null}
          {project.services.length ? (
            <div>
              <h2 className="label-caps mb-3">Services</h2>
              <ul className="space-y-1 text-sm">
                {project.services.map((s) => (
                  <li key={s.slug}><Link href={`/services/${s.slug}`} className="text-muted transition-colors hover:text-fg">{s.title}</Link></li>
                ))}
              </ul>
            </div>
          ) : null}
          {project.team.length ? (
            <div>
              <h2 className="label-caps mb-3">Team</h2>
              <ul className="space-y-3">
                {project.team.map((m) => (
                  <li key={m.slug}>
                    <Link href={`/team/${m.slug}`} className="group flex items-center gap-3">
                      {m.photo ? <MediaImage media={m.photo} alt="" ratio="1/1" rounded={false} className="size-10 shrink-0 rounded-full" sizes="40px" /> : <span aria-hidden className="grid size-10 place-items-center rounded-full bg-accent-soft text-sm font-semibold text-accent">{m.name.charAt(0)}</span>}
                      <span>
                        <span className="block text-sm font-medium text-fg transition-colors group-hover:text-accent">{m.name}</span>
                        <span className="block text-xs text-muted">{m.roleOnProject || m.roleTitle}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </aside>
      </div>

      {related.length ? (
        <Section aria-labelledby="related">
          <SectionHeading id="related" eyebrow="More work" title="Related projects" />
          <ul data-reveal="group" className="focus-group grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p) => <li key={p.id}><ProjectCard project={p} /></li>)}
          </ul>
        </Section>
      ) : null}

      <Section>
        <div data-reveal="item" className="glass-panel flex flex-col items-start gap-6 rounded-[2rem] p-8 sm:flex-row sm:items-center sm:justify-between sm:p-10">
          <div>
            <h2 className="text-2xl">Need something similar?</h2>
            <p className="mt-2 text-muted">Tell us about your process and we&apos;ll outline an approach.</p>
          </div>
          <Link href="/contact" className={buttonVariants({ size: "lg", className: "group/btn shrink-0" })}>Start a project <ArrowRight aria-hidden className="transition-transform duration-(--duration-base) ease-spring group-hover/btn:translate-x-0.5" /></Link>
        </div>
      </Section>

      <JsonLd
        data={[
          creativeWorkLd({
            name: project.title,
            description: project.summary || markdownToText(project.overview).slice(0, 300),
            path: `/projects/${project.slug}`,
            imageUrl: project.cover?.url,
            datePublished: project.publishedAt?.toISOString(),
            dateModified: project.updatedAt.toISOString(),
            keywords: techs.map((t) => t.label),
          }),
          breadcrumbLd([{ name: "Home", path: "/" }, { name: "Projects", path: "/projects" }, { name: project.title, path: `/projects/${project.slug}` }]),
          ...(videoLd ? [videoLd] : []),
        ]}
      />
    </article>
  );
}
