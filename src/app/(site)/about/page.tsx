import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { JsonLd } from "@/components/site/json-ld";
import { MapEmbed } from "@/components/site/map-embed";
import { Markdown } from "@/components/site/markdown";
import { PageHeader, Section, SectionHeading, ViewAllLink } from "@/components/site/section";
import { TeamCard } from "@/components/site/team-card";
import { buttonVariants } from "@/components/ui/button";
import { breadcrumbLd } from "@/lib/jsonld";
import { buildMetadata } from "@/lib/seo";
import { getPublicSettings } from "@/server/dal/public/site";
import { listPublishedPartners } from "@/server/dal/public/sponsorship";
import { listPublishedTeam } from "@/server/dal/public/team";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const { about, general } = await getPublicSettings();
  return buildMetadata({ title: about.title || `About ${general.siteName}`, description: about.intro || general.description, path: "/about" });
}

export default async function AboutPage() {
  const { about, general, home, team: teamSettings } = await getPublicSettings();
  const [team, partners] = await Promise.all([
    listPublishedTeam({ featuredOnly: true }),
    about.showPartnerLogos ? listPublishedPartners() : Promise.resolve([]),
  ]);
  const partnerLogos = partners.filter((p) => p.logo);
  return (
    <>
      <PageHeader eyebrow="About" title={about.title || `About ${general.siteName}`} description={about.intro} />
      {about.body ? (
        <Section>
          <Markdown source={about.body} className="text-lg" />
        </Section>
      ) : null}
      {about.storyBody ? (
        <Section aria-labelledby="story-title">
          <SectionHeading id="story-title" eyebrow="Our story" title="Why we started this" />
          <Markdown source={about.storyBody} className="text-lg" />
        </Section>
      ) : null}
      {about.missionBody || about.visionBody ? (
        <Section aria-label="Mission and vision">
          <div data-reveal="group" className="focus-group grid gap-4 sm:grid-cols-2">
            {about.missionBody ? (
              <div className="glass-card rounded-card p-6 sm:p-7">
                <p className="eyebrow mb-2">Mission</p>
                <p className="text-[0.9375rem] leading-relaxed text-muted">{about.missionBody}</p>
              </div>
            ) : null}
            {about.visionBody ? (
              <div className="glass-card rounded-card p-6 sm:p-7">
                <p className="eyebrow mb-2">Vision</p>
                <p className="text-[0.9375rem] leading-relaxed text-muted">{about.visionBody}</p>
              </div>
            ) : null}
          </div>
        </Section>
      ) : null}
      {about.whyAiBody ? (
        <Section aria-labelledby="why-ai-title">
          <SectionHeading id="why-ai-title" eyebrow="Philosophy" title="Why AI?" />
          <p className="max-w-2xl text-lg leading-relaxed text-muted">{about.whyAiBody}</p>
        </Section>
      ) : null}
      {home.process.length ? (
        <Section aria-labelledby="process-title">
          <SectionHeading id="process-title" eyebrow="Process" title="Our process" />
          <ol data-reveal="group" className="focus-group grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {home.process.map((step, i) => (
              <li key={step.title} className="glass-card rounded-card p-6 sm:p-7">
                <span className="grid size-8 place-items-center rounded-full bg-fg text-sm font-semibold text-bg tabular-nums">{i + 1}</span>
                <h3 className="mt-5 text-base font-semibold tracking-tight text-fg">{step.title}</h3>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">{step.body}</p>
              </li>
            ))}
          </ol>
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
      {about.timeline.length ? (
        <Section aria-labelledby="timeline-title">
          <SectionHeading id="timeline-title" eyebrow="History" title="Milestones" />
          <ol data-reveal="group" className="space-y-6 border-l border-(--glass-line) pl-6">
            {about.timeline.map((t) => (
              <li key={`${t.year}-${t.title}`}>
                <p className="text-sm font-semibold text-accent tabular-nums">{t.year}</p>
                <h3 className="mt-1 font-semibold text-fg">{t.title}</h3>
                {t.body ? <p className="mt-1 text-sm leading-relaxed text-muted">{t.body}</p> : null}
              </li>
            ))}
          </ol>
        </Section>
      ) : null}
      {about.awards.length ? (
        <Section aria-labelledby="awards-title">
          <SectionHeading id="awards-title" eyebrow="Recognition" title="Awards" />
          <ul data-reveal="group" className="focus-group grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {about.awards.map((a) => (
              <li key={a.title} className="glass-card rounded-card p-6">
                <h3 className="font-semibold text-fg">{a.title}</h3>
                {a.body ? <p className="mt-2 text-sm text-muted">{a.body}</p> : null}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
      {about.press.length ? (
        <Section aria-labelledby="press-title">
          <SectionHeading id="press-title" eyebrow="Press" title="In the media" />
          <ul className="glass-card divide-y divide-(--glass-line) overflow-hidden rounded-card">
            {about.press.map((p) => (
              <li key={p.title} className="flex items-center justify-between gap-4 px-5 py-4 text-sm">
                <span>
                  <span className="font-medium text-fg">{p.title}</span>
                  <span className="ml-2 text-muted">{p.outlet}</span>
                </span>
                {p.url ? (
                  <a href={p.url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-accent hover:underline">
                    Read
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
      {about.communityBody || about.impactBody ? (
        <Section aria-label="Community and impact">
          <div data-reveal="group" className="focus-group grid gap-4 sm:grid-cols-2">
            {about.communityBody ? (
              <div className="glass-card rounded-card p-6 sm:p-7">
                <p className="eyebrow mb-2">Community</p>
                <p className="text-[0.9375rem] leading-relaxed text-muted">{about.communityBody}</p>
              </div>
            ) : null}
            {about.impactBody ? (
              <div className="glass-card rounded-card p-6 sm:p-7">
                <p className="eyebrow mb-2">Impact</p>
                <p className="text-[0.9375rem] leading-relaxed text-muted">{about.impactBody}</p>
              </div>
            ) : null}
          </div>
        </Section>
      ) : null}
      {partnerLogos.length ? (
        <Section aria-label="Partners">
          <p className="label-caps mb-6 text-center">Partners</p>
          <ul className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6 opacity-80 grayscale">
            {partnerLogos.map((p) => (
              <li key={p.slug}>
                <Image src={p.logo!.url} alt={p.name} width={p.logo!.width ?? 140} height={p.logo!.height ?? 36} className="h-8 w-auto object-contain" unoptimized={p.logo!.mimeType === "image/svg+xml"} />
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
      {about.investors.length ? (
        <Section aria-label="Investors">
          <SectionHeading eyebrow="Backing" title="Investors" />
          <ul className="flex flex-wrap gap-2">
            {about.investors.map((inv) =>
              inv.url ? (
                <li key={inv.name}><a href={inv.url} target="_blank" rel="noopener noreferrer" className="glass-card inline-block rounded-full px-4 py-2 text-sm font-medium text-fg hover:text-accent">{inv.name}</a></li>
              ) : (
                <li key={inv.name} className="glass-card rounded-full px-4 py-2 text-sm font-medium text-fg">{inv.name}</li>
              ),
            )}
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
          {teamSettings.openRoles.length ? (
            <p className="mt-8 text-sm text-muted">
              We&apos;re hiring. <Link href="/team#roles-title" className="font-medium text-accent hover:underline">See open roles</Link>
            </p>
          ) : null}
        </Section>
      ) : null}
      {general.address ? (
        <Section aria-label="Office location">
          <SectionHeading eyebrow="Where we are" title="Office" />
          <MapEmbed address={general.address} />
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
