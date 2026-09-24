import { Mail, MapPin } from "lucide-react";
import type { Metadata } from "next";

import { ContactForm } from "@/components/site/contact-form";
import { JsonLd } from "@/components/site/json-ld";
import { PageHeader, Section } from "@/components/site/section";
import { breadcrumbLd } from "@/lib/jsonld";
import { buildMetadata } from "@/lib/seo";
import { listPublishedServices } from "@/server/dal/public/services";
import { getPublicSettings } from "@/server/dal/public/site";

export async function generateMetadata(): Promise<Metadata> {
  const { general } = await getPublicSettings();
  return buildMetadata({ title: "Contact", description: `Start a project with ${general.siteName}. Tell us about the process you want to automate or the AI system you want to build.`, path: "/contact" });
}

export default async function ContactPage(props: PageProps<"/contact">) {
  const sp = await props.searchParams;
  const [{ contact, general }, services] = await Promise.all([getPublicSettings(), listPublishedServices()]);
  const preselected = typeof sp.service === "string" && services.some((s) => s.id === sp.service) ? sp.service : "";
  return (
    <>
      <PageHeader eyebrow="Contact" title="Start a project" description={contact.intro} />
      <Section>
        <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr]">
          <div className="rounded-card border border-border bg-surface/60 p-5 sm:p-8">
            <ContactForm services={services.map((s) => ({ id: s.id, title: s.title }))} budgets={contact.budgets} timelines={contact.timelines} defaultServiceId={preselected} />
          </div>
          <aside className="space-y-6">
            <div className="rounded-card border border-border p-6">
              <h2 className="font-semibold">What happens next</h2>
              <ol className="mt-4 space-y-3 text-sm text-muted">
                <li><span className="font-mono text-accent">01</span> We read your message and reply by email.</li>
                <li><span className="font-mono text-accent">02</span> A short call to understand the process and constraints.</li>
                <li><span className="font-mono text-accent">03</span> A written proposal with scope, approach and timeline.</li>
              </ol>
            </div>
            {general.contactEmail || general.location ? (
              <div className="space-y-3 rounded-card border border-border p-6 text-sm">
                {general.contactEmail ? <p className="flex items-center gap-2"><Mail aria-hidden className="size-4 text-accent" /><a href={`mailto:${general.contactEmail}`} className="hover:underline">{general.contactEmail}</a></p> : null}
                {general.location ? <p className="flex items-center gap-2 text-muted"><MapPin aria-hidden className="size-4 text-accent" />{general.location}</p> : null}
              </div>
            ) : null}
          </aside>
        </div>
      </Section>
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Contact", path: "/contact" }])} />
    </>
  );
}
