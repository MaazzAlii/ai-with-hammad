import { ArrowRight, BriefcaseBusiness } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { JsonLd } from "@/components/site/json-ld";
import { EmptyState, PageHeader, Section } from "@/components/site/section";
import { ServiceCard } from "@/components/site/service-card";
import { buttonVariants } from "@/components/ui/button";
import { breadcrumbLd, serviceLd } from "@/lib/jsonld";
import { buildMetadata } from "@/lib/seo";
import { getServiceFeatureTitles, listPublishedServices } from "@/server/dal/public/services";
import { getPublicSettings } from "@/server/dal/public/site";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const { general } = await getPublicSettings();
  return buildMetadata({
    title: "Services",
    description: `AI engineering, workflow automation, API integration and agentic AI services from ${general.siteName}.`,
    path: "/services",
  });
}

export default async function ServicesPage() {
  const services = await listPublishedServices();
  const features = await getServiceFeatureTitles(services.map((s) => s.id));
  return (
    <>
      <PageHeader eyebrow="Services" title="What we build" description="Scoped engagements — from one automated workflow to agent systems that run part of your operations." />
      <Section>
        {services.length ? (
          <ul data-reveal="group" className="focus-group grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
            {services.map((s) => (
              <li key={s.id}>
                <ServiceCard service={s} features={features.get(s.id)} />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="Services are being updated" icon={<BriefcaseBusiness />}>Check back soon, or contact us directly — we are happy to talk it through.</EmptyState>
        )}
      </Section>
      {services.length ? (
        <Section>
          <div data-reveal="item" className="glass-panel flex flex-col items-start gap-6 rounded-[2rem] p-8 sm:flex-row sm:items-center sm:justify-between sm:p-10">
            <div>
              <h2 className="text-2xl">Not sure which service fits?</h2>
              <p className="mt-2 text-muted">Tell us what you&apos;re trying to solve and we&apos;ll point you at the right one — or a mix.</p>
            </div>
            <Link href="/contact" className={buttonVariants({ size: "lg", className: "group/btn shrink-0" })}>
              Talk it through <ArrowRight aria-hidden className="transition-transform duration-(--duration-base) ease-spring group-hover/btn:translate-x-0.5" />
            </Link>
          </div>
        </Section>
      ) : null}
      <JsonLd
        data={[
          breadcrumbLd([{ name: "Home", path: "/" }, { name: "Services", path: "/services" }]),
          ...services.map((s) => serviceLd({ name: s.title, description: s.summary, path: `/services/${s.slug}` })),
        ]}
      />
    </>
  );
}
