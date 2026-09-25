import { BriefcaseBusiness } from "lucide-react";
import type { Metadata } from "next";

import { JsonLd } from "@/components/site/json-ld";
import { EmptyState, PageHeader, Section } from "@/components/site/section";
import { ServiceCard } from "@/components/site/service-card";
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
          <ul data-reveal="group" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
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
      <JsonLd
        data={[
          breadcrumbLd([{ name: "Home", path: "/" }, { name: "Services", path: "/services" }]),
          ...services.map((s) => serviceLd({ name: s.title, description: s.summary, path: `/services/${s.slug}` })),
        ]}
      />
    </>
  );
}
