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
import { VideoEmbed } from "@/components/site/video-embed";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { breadcrumbLd, serviceLd } from "@/lib/jsonld";
import { buildMetadata } from "@/lib/seo";
import { listProjectsForService } from "@/server/dal/public/projects";
import { getPublishedService, listPublishedServices } from "@/server/dal/public/services";

export const revalidate = 3600;

const NARRATIVE = [
  ["processNotes", "Our process for this service"],
  ["technicalNotes", "Security, rate limits & error handling"],
  ["trainingAndDocs", "Training & documentation"],
  ["engagementTerms", "Terms of engagement"],
  ["slaNotes", "SLA"],
  ["comparisonNotes", "Why us"],
] as const;

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
  const facts = [
    ["Starting at", service.startingAtPrice],
    ["Timeline", service.timelineEstimate],
    ["Best for", service.idealFor],
  ].filter(([, v]) => v);
  const sections = NARRATIVE.filter(([key]) => service[key].trim());
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
          <div className="min-w-0 space-y-10">
            {service.cover ? <MediaImage media={service.cover} priority className="shadow-panel" sizes="(min-width: 1024px) 55vw, 100vw" /> : null}
            <Markdown source={service.description} />
            {service.videoEmbed ? <VideoEmbed embed={service.videoEmbed} title={`${service.title} demo`} /> : null}
            {service.addOns.length ? (
              <div>
                <h2 className="mb-5 text-[1.375rem]">Add-ons</h2>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {service.addOns.map((a) => (
                    <li key={a.title} className="glass-card rounded-card p-5">
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="font-medium text-fg">{a.title}</p>
                        {a.priceNote ? <p className="text-sm text-accent whitespace-nowrap">{a.priceNote}</p> : null}
                      </div>
                      {a.description ? <p className="mt-1.5 text-sm leading-relaxed text-muted">{a.description}</p> : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {sections.map(([key, label]) => (
              <div key={key}>
                <h2 className="mb-4 text-[1.375rem]">{label}</h2>
                <Markdown source={service[key]} />
              </div>
            ))}
          </div>
          <aside className="h-fit space-y-6 lg:sticky lg:top-[calc(var(--header-h)+2rem)]" aria-label="Service details">
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
            {service.features.length ? (
              <div aria-labelledby="included" className="glass-panel rounded-card p-6 sm:p-7">
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
              </div>
            ) : null}
            {service.techStack.length ? (
              <div>
                <h2 className="label-caps mb-3">Tech stack</h2>
                <ul className="flex flex-wrap gap-1.5">{service.techStack.map((t) => <li key={t}><Badge>{t}</Badge></li>)}</ul>
              </div>
            ) : null}
          </aside>
        </div>
      </Section>
      {projects.length ? (
        <Section aria-labelledby="related-work">
          <SectionHeading id="related-work" eyebrow="Related work" title={`${service.title} projects`} />
          <ul data-reveal="group" className="focus-group grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
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
