import { ChevronRight, Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import type { Metadata } from "next";

import { ContactForm } from "@/components/site/contact-form";
import { FaqList } from "@/components/site/faq";
import { JsonLd } from "@/components/site/json-ld";
import { PageHeader, Section, SectionHeading } from "@/components/site/section";
import { breadcrumbLd } from "@/lib/jsonld";
import { buildMetadata } from "@/lib/seo";
import { listPublishedServices } from "@/server/dal/public/services";
import { getPublicSettings } from "@/server/dal/public/site";
import { listPublishedFaqs } from "@/server/dal/public/testimonials";
import { whatsappLink } from "@/lib/whatsapp";

const NEXT_STEPS = [
  "We read your message and reply by email.",
  "A short call to understand the process, the tools involved and the constraints.",
  "A written proposal with scope, approach and timeline.",
];

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
        <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr] lg:gap-8">
          <div className="glass-panel rounded-[1.75rem] p-5 sm:p-8">
            <ContactForm services={services.map((s) => ({ id: s.id, title: s.title }))} budgets={contact.budgets} timelines={contact.timelines} defaultServiceId={preselected} />
          </div>
          <aside className="space-y-4">
            <div className="glass-card rounded-card p-6 sm:p-7">
              <h2 className="text-base font-semibold tracking-tight">What happens next</h2>
              <ol className="mt-5 space-y-4 text-sm leading-relaxed text-muted">
                {NEXT_STEPS.map((step, i) => (
                  <li key={step} className="flex gap-3">
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-fg text-xs font-semibold text-bg tabular-nums">{i + 1}</span>
                    <span className="pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
            {wa ? (
              <a href={wa} target="_blank" rel="noopener noreferrer" className="group glass-card lift flex items-center gap-4 rounded-card p-5 sm:p-6">
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-whatsapp text-whatsapp-fg shadow-[inset_0_1px_0_rgb(255_255_255/0.35)]">
                  <MessageCircle aria-hidden className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-fg">Prefer WhatsApp?</span>
                  <span className="block text-sm text-muted">Most of our day-to-day communication happens there.</span>
                </span>
                <ChevronRight aria-hidden className="size-4 shrink-0 text-subtle transition-transform duration-(--duration-base) ease-spring group-hover:translate-x-0.5" />
              </a>
            ) : null}
            {general.contactEmail || general.location || general.phone || general.businessHours || general.address ? (
              <ul className="glass-card divide-y divide-(--glass-line) rounded-card text-sm">
                {general.contactEmail ? (
                  <li>
                    <a href={`mailto:${general.contactEmail}`} className="flex min-h-12 items-center gap-3 px-5 transition-colors hover:bg-fg/[0.03]">
                      <Mail aria-hidden className="size-4 text-subtle" /> {general.contactEmail}
                    </a>
                  </li>
                ) : null}
                {general.phone ? (
                  <li>
                    <a href={`tel:${general.phone.replace(/[^+\d]/g, "")}`} className="flex min-h-12 items-center gap-3 px-5 transition-colors hover:bg-fg/[0.03]">
                      <Phone aria-hidden className="size-4 text-subtle" /> {general.phone}
                    </a>
                  </li>
                ) : null}
                {general.businessHours ? (
                  <li className="flex min-h-12 items-center gap-3 px-5 text-muted">
                    <Clock aria-hidden className="size-4 text-subtle" /> {general.businessHours}
                  </li>
                ) : null}
                {general.location || general.address ? (
                  <li className="flex min-h-12 items-start gap-3 px-5 py-3.5 text-muted">
                    <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-subtle" /> {[general.address, general.location].filter(Boolean).join(", ")}
                  </li>
                ) : null}
              </ul>
            ) : null}
          </aside>
        </div>
      </Section>
      {faqs.length && contact.showFaq ? (
        <Section aria-labelledby="contact-faq">
          <SectionHeading id="contact-faq" eyebrow="FAQ" title="Common questions" />
          <FaqList items={faqs} />
        </Section>
      ) : null}
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Contact", path: "/contact" }])} />
    </>
  );
}
