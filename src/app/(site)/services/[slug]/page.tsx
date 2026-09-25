import { ArrowRight, Check } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ServiceIcon } from "@/components/site/icons";
import { JsonLd } from "@/components/site/json-ld";
import { Markdown } from "@/components/site/markdown";
import { MediaImage } from "@/components/site/media-image";
import { ProjectCard } from "@/components/site/project-card";
import { Breadcrumb, PageHeader, Section, SectionHeading } from "@/components/site/section";
import { buttonVariants } from "@/components/ui/button";
import { breadcrumbLd, serviceLd } from "@/lib/jsonld";
import { buildMetadata } from "@/lib/seo";
import { listProjectsForService } from "@/server/dal/public/projects";
import { getPublishedService, listPublishedServices } from "@/server/dal/public/services";

export const revalidate = 3600;

export async function generateStaticParams() {
  return (await listPublishedServices()).map((s) => ({ slug: s.slug }));
}

export async function generateMetadata(props: PageProps<"/services/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const s = await getPublishedService(slug);
  if (!s) return {};
  return buildMetadata({ title: s.seoTitle || s.title, description: s.seoDescription || s.summary, path: `/services/${s.slug}`, image: s.cover });
}

export default async function ServicePage(props: PageProps<"/services/[slug]">) {
  const { slug } = await props.params;
  const service = await getPublishedService(slug);
  if (!service) notFound();
  const projects = await listProjectsForService(service.id);
  return (
    <>
      <PageHeader
        title={service.title}
        description={service.summary}
        breadcrumb={
          <>
            <Breadcrumb href="/services" label="Services" current={service.title} />
            <span className="mb-6 grid size-14 place-items-center rounded-[1.1rem] bg-accent-soft text-accent">
              <ServiceIcon name={service.icon} className="size-7" />
            </span>
          </>
        }
      >
        <Link href={`/contact?service=${service.id}`} className={buttonVariants({ size: "lg", className: "group/btn mt-9" })}>
          Discuss this service
          <ArrowRight aria-hidden className="transition-transform duration-(--duration-base) ease-spring group-hover/btn:translate-x-0.5" />
        </Link>
      </PageHeader>
      <Section>
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
          <div className="min-w-0">
            {service.cover ? <MediaImage media={service.cover} priority className="mb-10 shadow-panel" sizes="(min-width: 1024px) 55vw, 100vw" /> : null}
            <Markdown source={service.description} />
          </div>
          {service.features.length ? (
            <aside aria-labelledby="included" className="glass-panel h-fit rounded-card p-6 sm:p-7 lg:sticky lg:top-[calc(var(--header-h)+2rem)]">
              <h2 id="included" className="text-lg">What&apos;s included</h2>
              <ul className="mt-5 space-y-4">
                {service.features.map((f) => (
                  <li key={f.title} className="flex gap-3">
                    <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-accent-2 text-white dark:text-bg">
                      <Check aria-hidden className="size-3" strokeWidth={3} />
                    </span>
                    <div>
                      <p className="font-medium text-fg">{f.title}</p>
                      {f.description ? <p className="mt-1 text-sm leading-relaxed text-muted">{f.description}</p> : null}
                    </div>
                  </li>
                ))}
              </ul>
            </aside>
          ) : null}
        </div>
      </Section>
      {projects.length ? (
        <Section aria-labelledby="related-work">
          <SectionHeading id="related-work" eyebrow="Related work" title={`${service.title} projects`} />
          <ul data-reveal="group" className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <li key={p.id}>
                <ProjectCard project={p} />
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
      <JsonLd
        data={[
          serviceLd({ name: service.title, description: service.summary, path: `/services/${service.slug}` }),
          breadcrumbLd([{ name: "Home", path: "/" }, { name: "Services", path: "/services" }, { name: service.title, path: `/services/${service.slug}` }]),
        ]}
      />
    </>
  );
}
