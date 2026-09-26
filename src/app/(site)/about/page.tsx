import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { JsonLd } from "@/components/site/json-ld";
import { Markdown } from "@/components/site/markdown";
import { PageHeader, Section, SectionHeading, ViewAllLink } from "@/components/site/section";
import { TeamCard } from "@/components/site/team-card";
import { buttonVariants } from "@/components/ui/button";
import { breadcrumbLd } from "@/lib/jsonld";
import { buildMetadata } from "@/lib/seo";
import { getPublicSettings } from "@/server/dal/public/site";
import { listPublishedTeam } from "@/server/dal/public/team";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const { about, general } = await getPublicSettings();
  return buildMetadata({ title: about.title || `About ${general.siteName}`, description: about.intro || general.description, path: "/about" });
}

export default async function AboutPage() {
  const [{ about, general }, team] = await Promise.all([getPublicSettings(), listPublishedTeam({ featuredOnly: true })]);
  return (
    <>
      <PageHeader eyebrow="About" title={about.title || `About ${general.siteName}`} description={about.intro} />
      {about.body ? (
        <Section>
          <Markdown source={about.body} className="text-lg" />
        </Section>
      ) : null}
      {about.values.length ? (
        <Section aria-labelledby="values-title">
          <SectionHeading id="values-title" eyebrow="Principles" title="How we work" />
          <ul data-reveal="group" className="focus-group grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {about.values.map((v) => (
              <li key={v.title} className="glass-card rounded-card p-6 sm:p-7">
                <h3 className="text-base font-semibold tracking-tight text-fg">{v.title}</h3>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">{v.body}</p>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
      {team.length ? (
        <Section aria-labelledby="about-team">
          <SectionHeading id="about-team" eyebrow="People" title="The team" action={<ViewAllLink href="/team">Full team</ViewAllLink>} />
          <ul data-reveal="group" className="focus-group grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-4">
            {team.slice(0, 4).map((m) => (
              <li key={m.id}>
                <TeamCard member={m} compact />
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
      <Section>
        <div data-reveal="item" className="glass-panel flex flex-col items-start gap-6 rounded-[2rem] p-8 sm:flex-row sm:items-center sm:justify-between sm:p-10">
          <div>
            <h2 className="text-2xl">Want to work with us?</h2>
            <p className="mt-2 text-muted">Tell us about the process you want to improve.</p>
          </div>
          <Link href="/contact" className={buttonVariants({ size: "lg", className: "group/btn shrink-0" })}>
            Get in touch <ArrowRight aria-hidden className="transition-transform duration-(--duration-base) ease-spring group-hover/btn:translate-x-0.5" />
          </Link>
        </div>
      </Section>
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "About", path: "/about" }])} />
    </>
  );
}
