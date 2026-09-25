import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import type { Metadata } from "next";

import { ContactForm } from "@/components/site/contact-form";
import { FaqList } from "@/components/site/faq";
import { JsonLd } from "@/components/site/json-ld";
import { PageHeader, Section } from "@/components/site/section";
import { breadcrumbLd } from "@/lib/jsonld";
import { buildMetadata } from "@/lib/seo";
import { listPublishedServices } from "@/server/dal/public/services";
import { getPublicSettings } from "@/server/dal/public/site";
import { listPublishedFaqs } from "@/server/dal/public/testimonials";
import { whatsappLink } from "@/lib/whatsapp";

export async function generateMetadata(): Promise<Metadata> {
  const { general } = await getPublicSettings();
  return buildMetadata({ title: "Contact", description: `Start a project with ${general.siteName}. Tell us about the process you want to automate or the AI system you want to build.`, path: "/contact" });
}

export default async function ContactPage(props: PageProps<"/contact">) {
  const sp = await props.searchParams;
  const [{ contact, general }, services, faqs] = await Promise.all([getPublicSettings(), listPublishedServices(), listPublishedFaqs()]);
  const wa = whatsappLink(general.whatsapp, general.whatsappMessage);
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
            {wa ? (
              <a href={wa} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 rounded-card border border-success/30 bg-success-soft p-6 transition-colors hover:border-success/60">
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#25d366] text-[#03240f]"><MessageCircle aria-hidden className="size-5" /></span>
                <span>
                  <span className="block font-semibold text-fg">Prefer WhatsApp?</span>
                  <span className="block text-sm text-muted">Most of our day-to-day communication happens there.</span>
                </span>
              </a>
            ) : null}
            {general.contactEmail || general.location || general.phone || general.businessHours || general.address ? (
              <div className="space-y-3 rounded-card border border-border p-6 text-sm">
                {general.contactEmail ? <p className="flex items-center gap-2"><Mail aria-hidden className="size-4 text-accent" /><a href={`mailto:${general.contactEmail}`} className="hover:underline">{general.contactEmail}</a></p> : null}
                {general.phone ? <p className="flex items-center gap-2"><Phone aria-hidden className="size-4 text-accent" /><a href={`tel:${general.phone.replace(/[^+\d]/g, "")}`} className="hover:underline">{general.phone}</a></p> : null}
                {general.businessHours ? <p className="flex items-center gap-2 text-muted"><Clock aria-hidden className="size-4 text-accent" />{general.businessHours}</p> : null}
                {general.location || general.address ? <p className="flex items-start gap-2 text-muted"><MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-accent" />{[general.address, general.location].filter(Boolean).join(", ")}</p> : null}
              </div>
            ) : null}
          </aside>
        </div>
      </Section>
      {faqs.length ? (
        <Section className="border-t border-border" aria-labelledby="contact-faq">
          <h2 id="contact-faq" className="mb-6 text-2xl font-semibold">Frequently asked questions</h2>
          <FaqList items={faqs} />
        </Section>
      ) : null}
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Contact", path: "/contact" }])} />
    </>
  );
}
