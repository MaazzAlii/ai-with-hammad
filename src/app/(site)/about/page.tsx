import type { Metadata } from "next";
import Link from "next/link";

import { JsonLd } from "@/components/site/json-ld";
import { Markdown } from "@/components/site/markdown";
import { PageHeader, Section, SectionHeading } from "@/components/site/section";
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
        <Section className="border-t border-border" aria-labelledby="values-title">
          <SectionHeading id="values-title" eyebrow="Principles" title="How we work" />
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {about.values.map((v) => (
              <li key={v.title} className="rounded-card border border-border bg-surface/60 p-6">
                <h3 className="font-semibold text-fg">{v.title}</h3>
                <p className="mt-2 text-sm text-muted">{v.body}</p>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
      {team.length ? (
        <Section className="border-t border-border" aria-labelledby="about-team">
          <SectionHeading id="about-team" eyebrow="People" title="The team" action={<Link href="/team" className={buttonVariants({ variant: "outline", size: "sm" })}>Full team</Link>} />
          <ul className="grid grid-cols-2 gap-6 lg:grid-cols-4">
            {team.slice(0, 4).map((m) => (
              <li key={m.id}>
                <TeamCard member={m} compact />
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
      <Section className="border-t border-border">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-lg text-fg">Want to work with us?</p>
          <Link href="/contact" className={buttonVariants({ size: "lg" })}>
            Get in touch
          </Link>
        </div>
      </Section>
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "About", path: "/about" }])} />
    </>
  );
}
