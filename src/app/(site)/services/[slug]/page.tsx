import { ArrowRight, Check } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ServiceIcon } from "@/components/site/icons";
import { JsonLd } from "@/components/site/json-ld";
import { Markdown } from "@/components/site/markdown";
import { MediaImage } from "@/components/site/media-image";
import { ProjectCard } from "@/components/site/project-card";
import { Section, SectionHeading } from "@/components/site/section";
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
      <header className="relative overflow-hidden border-b border-border">
        <div aria-hidden className="bg-grid absolute inset-0" />
        <div className="container-page relative py-14 sm:py-20">
          <nav aria-label="Breadcrumb" className="mb-6 text-sm text-subtle">
            <Link href="/services" className="hover:text-fg">Services</Link> <span aria-hidden>/</span> <span className="text-muted">{service.title}</span>
          </nav>
          <span className="mb-5 grid size-12 place-items-center rounded-control border border-accent/30 bg-accent-soft text-accent">
            <ServiceIcon name={service.icon} className="size-6" />
          </span>
          <h1 className="max-w-3xl text-3xl font-semibold sm:text-5xl">{service.title}</h1>
          <p className="mt-4 max-w-2xl text-muted sm:text-lg">{service.summary}</p>
          <Link href={`/contact?service=${service.id}`} className={buttonVariants({ size: "lg", className: "mt-8" })}>
            Discuss this service <ArrowRight aria-hidden />
          </Link>
        </div>
      </header>
      <Section>
        <div className="grid gap-12 lg:grid-cols-[1.3fr_1fr]">
          <div>
            {service.cover ? <MediaImage media={service.cover} priority className="mb-10" sizes="(min-width: 1024px) 55vw, 100vw" /> : null}
            <Markdown source={service.description} />
          </div>
          {service.features.length ? (
            <aside aria-labelledby="included" className="h-fit rounded-card border border-border bg-surface/60 p-6">
              <h2 id="included" className="font-semibold text-fg">What&apos;s included</h2>
              <ul className="mt-4 space-y-4">
                {service.features.map((f) => (
                  <li key={f.title} className="flex gap-3">
                    <Check aria-hidden className="mt-0.5 size-5 shrink-0 text-accent-2" />
                    <div>
                      <p className="font-medium text-fg">{f.title}</p>
                      {f.description ? <p className="mt-1 text-sm text-muted">{f.description}</p> : null}
                    </div>
                  </li>
                ))}
              </ul>
            </aside>
          ) : null}
        </div>
      </Section>
      {projects.length ? (
        <Section className="border-t border-border" aria-labelledby="related-work">
          <SectionHeading id="related-work" eyebrow="Related work" title={`${service.title} projects`} />
          <ul className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
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
