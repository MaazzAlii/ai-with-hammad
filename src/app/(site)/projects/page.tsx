import { FolderKanban } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { JsonLd } from "@/components/site/json-ld";
import { ProjectCard } from "@/components/site/project-card";
import { EmptyState, PageHeader, Section } from "@/components/site/section";
import { breadcrumbLd } from "@/lib/jsonld";
import { buttonVariants } from "@/components/ui/button";
import { buildMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";
import { getProjectFacets, listPublishedProjects } from "@/server/dal/public/projects";

export async function generateMetadata(props: PageProps<"/projects">): Promise<Metadata> {
  const sp = await props.searchParams;
  const filtered = Boolean(sp.category || sp.tech);
  return {
    ...buildMetadata({
      title: "Projects & case studies",
      description: "Case studies of AI engineering, workflow automation and agentic systems — problem, approach, architecture and results.",
      path: "/projects",
    }),
    // Filtered views are variations of the canonical index; keep them out of the index.
    ...(filtered ? { robots: { index: false, follow: true } } : {}),
  };
}

function chip(active: boolean) {
  return cn(
    "pressable inline-flex min-h-9 items-center rounded-full px-3.5 text-sm whitespace-nowrap",
    active ? "bg-fg font-medium text-bg shadow-card" : "bg-fg/[0.05] text-muted hover:bg-fg/[0.08] hover:text-fg",
  );
}

export default async function ProjectsPage(props: PageProps<"/projects">) {
  const sp = await props.searchParams;
  const category = typeof sp.category === "string" ? sp.category.slice(0, 80) : undefined;
  const tech = typeof sp.tech === "string" ? sp.tech.slice(0, 80) : undefined;
  const [projects, facets] = await Promise.all([listPublishedProjects({ category, tech }), getProjectFacets()]);
  const qs = (next: { category?: string; tech?: string }) => {
    const p = new URLSearchParams();
    if (next.category) p.set("category", next.category);
    if (next.tech) p.set("tech", next.tech);
    const s = p.toString();
    return s ? `/projects?${s}` : "/projects";
  };
  return (
    <>
      <PageHeader eyebrow="Work" title="Projects & case studies" description="Real systems we've designed and built — with the problem, the approach, the architecture and what changed." />
      <Section>
        {facets.categories.length || facets.technologies.length ? (
          <nav aria-label="Filter projects" className="mb-12 space-y-3">
            {facets.categories.length ? (
              <div className="-mx-5 flex items-center gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
                <span className="label-caps mr-1 shrink-0">Category</span>
                <Link href={qs({ tech })} className={chip(!category)} aria-current={!category ? "true" : undefined}>All</Link>
                {facets.categories.map((c) => (
                  <Link key={c} href={qs({ category: c, tech })} className={chip(category === c)} aria-current={category === c ? "true" : undefined}>
                    {c}
                  </Link>
                ))}
              </div>
            ) : null}
            {facets.technologies.length ? (
              <div className="-mx-5 flex items-center gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
                <span className="label-caps mr-1 shrink-0">Technology</span>
                <Link href={qs({ category })} className={chip(!tech)} aria-current={!tech ? "true" : undefined}>All</Link>
                {facets.technologies.map((t) => (
                  <Link key={t.slug} href={qs({ category, tech: t.slug })} className={chip(tech === t.slug)} aria-current={tech === t.slug ? "true" : undefined}>
                    {t.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </nav>
        ) : null}
        <p className="sr-only" aria-live="polite">
          {projects.length} project{projects.length === 1 ? "" : "s"} shown
        </p>
        {projects.length ? (
          <ul data-reveal="group" className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p, i) => (
              <li key={p.id}>
                <ProjectCard project={p} priority={i < 2} headingLevel={2} />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title={category || tech ? "No projects match these filters" : "Case studies coming soon"}
            icon={<FolderKanban />}
            actions={
              category || tech ? null : (
                <>
                  <Link href="/contact" className={buttonVariants()}>Start a project</Link>
                  <Link href="/services" className={buttonVariants({ variant: "secondary" })}>What we build</Link>
                </>
              )
            }
          >
            {category || tech ? <Link href="/projects" className="font-medium text-accent hover:underline">Clear filters</Link> : "We're preparing detailed write-ups of our work."}
          </EmptyState>
        )}
      </Section>
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Projects", path: "/projects" }])} />
    </>
  );
}
