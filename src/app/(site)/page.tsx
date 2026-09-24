import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { ContentCard } from "@/components/site/content-card";
import { MediaImage } from "@/components/site/media-image";
import { ProjectCard } from "@/components/site/project-card";
import { Section, SectionHeading } from "@/components/site/section";
import { ServiceCard } from "@/components/site/service-card";
import { TeamCard } from "@/components/site/team-card";
import { buttonVariants } from "@/components/ui/button";
import { buildMetadata } from "@/lib/seo";
import { safeHref } from "@/lib/url-safety";
import { groupContent, listPublishedContent } from "@/server/dal/public/content";
import { listHomepageProjects } from "@/server/dal/public/projects";
import { getServiceFeatureTitles, listPublishedServices } from "@/server/dal/public/services";
import { getPublicSettings, getSiteMedia } from "@/server/dal/public/site";
import { listPublishedTeam } from "@/server/dal/public/team";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const [{ seo, general }, media] = await Promise.all([getPublicSettings(), getSiteMedia()]);
  const meta = buildMetadata({
    title: seo.defaultTitle || general.siteName,
    description: seo.defaultDescription || general.description,
    path: "/",
    image: media.ogImage,
  });
  // The home page uses the full default title (no "· Site" template suffix).
  return { ...meta, title: { absolute: seo.defaultTitle || general.siteName } };
}

export default async function HomePage() {
  const [settings, media, services, projects, team, content] = await Promise.all([
    getPublicSettings(),
    getSiteMedia(),
    listPublishedServices(),
    listHomepageProjects(6),
    listPublishedTeam({ featuredOnly: true }),
    listPublishedContent(),
  ]);
  const { home, general } = settings;
  const featureTitles = await getServiceFeatureTitles(services.map((s) => s.id));
  const highlighted = groupContent(content, "high-performing", 3);
  const showcaseContent = highlighted.length ? highlighted : groupContent(content, "featured", 3).length ? groupContent(content, "featured", 3) : groupContent(content, "latest", 3);
  const primaryHref = safeHref(home.primaryCtaHref) ?? "/contact";
  const secondaryHref = safeHref(home.secondaryCtaHref) ?? "/projects";

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border" aria-labelledby="hero-title">
        <div aria-hidden className="bg-grid absolute inset-0" />
        <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 h-[28rem] w-[48rem] -translate-x-1/2 rounded-full bg-accent/10 blur-3xl" />
        <div className={`container-page relative grid items-center gap-12 py-20 sm:py-28 ${media.heroImage ? "lg:grid-cols-[1.1fr_0.9fr]" : ""}`}>
          <div className={media.heroImage ? "" : "mx-auto max-w-3xl text-center"}>
            {home.heroEyebrow ? (
              <p className={`eyebrow inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-3.5 py-1.5 ${media.heroImage ? "" : "mx-auto"}`}>
                <span aria-hidden className="size-1.5 animate-pulse rounded-full bg-accent-2" />
                {home.heroEyebrow}
              </p>
            ) : null}
            <h1 id="hero-title" className="mt-6 text-4xl leading-[1.08] font-bold sm:text-6xl">
              {home.heroTitle}
            </h1>
            {home.heroSubtitle ? <p className="mt-6 text-lg text-muted sm:text-xl">{home.heroSubtitle}</p> : null}
            <div className={`mt-10 flex flex-col gap-3 sm:flex-row ${media.heroImage ? "" : "sm:justify-center"}`}>
              <Link href={primaryHref} className={buttonVariants({ size: "lg" })}>
                {home.primaryCtaLabel} <ArrowRight aria-hidden />
              </Link>
              <Link href={secondaryHref} className={buttonVariants({ size: "lg", variant: "secondary" })}>
                {home.secondaryCtaLabel}
              </Link>
            </div>
          </div>
          {media.heroImage ? <MediaImage media={media.heroImage} ratio="4/3" priority sizes="(min-width: 1024px) 45vw, 100vw" /> : null}
        </div>
      </section>

      {/* Positioning */}
      {home.positioningTitle ? (
        <Section aria-labelledby="positioning-title">
          <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr] lg:items-start">
            <div>
              <p className="eyebrow mb-3">Who we are</p>
              <h2 id="positioning-title" className="text-2xl font-semibold sm:text-4xl">
                {home.positioningTitle}
              </h2>
            </div>
            <div>
              <p className="text-lg text-muted">{home.positioningBody}</p>
              <Link href="/about" className={buttonVariants({ variant: "link", className: "mt-4" })}>
                About {general.siteName} <ArrowRight aria-hidden />
              </Link>
            </div>
          </div>
        </Section>
      ) : null}

      {/* Services */}
      {services.length ? (
        <Section aria-labelledby="services-title" className="border-t border-border">
          <SectionHeading
            id="services-title"
            eyebrow="What we build"
            title="Services"
            description="Focused engagements that turn AI and automation into dependable systems."
            action={
              <Link href="/services" className={buttonVariants({ variant: "outline", size: "sm" })}>
                All services
              </Link>
            }
          />
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {services.slice(0, 6).map((s) => (
              <li key={s.id}>
                <ServiceCard service={s} features={featureTitles.get(s.id)} />
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {/* Selected projects */}
      {projects.length ? (
        <Section aria-labelledby="work-title" className="border-t border-border">
          <SectionHeading
            id="work-title"
            eyebrow="Selected work"
            title="Projects & case studies"
            description="How we approached real problems — architecture, implementation and results."
            action={
              <Link href="/projects" className={buttonVariants({ variant: "outline", size: "sm" })}>
                View all projects
              </Link>
            }
          />
          <ul className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p, i) => (
              <li key={p.id}>
                <ProjectCard project={p} priority={i === 0 && !media.heroImage} />
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {/* Capabilities */}
      {home.capabilities.length ? (
        <Section aria-labelledby="capabilities-title" className="border-t border-border">
          <SectionHeading id="capabilities-title" eyebrow="Engineering capability" title="How we build" />
          <ul className="grid gap-px overflow-hidden rounded-card border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
            {home.capabilities.map((c) => (
              <li key={c.title} className="bg-surface p-6">
                <h3 className="font-semibold text-fg">{c.title}</h3>
                <p className="mt-2 text-sm text-muted">{c.body}</p>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {/* Process */}
      {home.process.length ? (
        <Section aria-labelledby="process-title" className="border-t border-border">
          <SectionHeading id="process-title" eyebrow="Workflow" title="Our process" />
          <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {home.process.map((step, i) => (
              <li key={step.title} className="relative rounded-card border border-border bg-surface/60 p-6">
                <span className="font-mono text-sm text-accent">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-3 font-semibold text-fg">{step.title}</h3>
                <p className="mt-2 text-sm text-muted">{step.body}</p>
              </li>
            ))}
          </ol>
        </Section>
      ) : null}

      {/* Team */}
      {team.length ? (
        <Section aria-labelledby="team-title" className="border-t border-border">
          <SectionHeading
            id="team-title"
            eyebrow="People"
            title="Core team"
            action={
              <Link href="/team" className={buttonVariants({ variant: "outline", size: "sm" })}>
                Meet the team
              </Link>
            }
          />
          <ul className="grid grid-cols-2 gap-6 lg:grid-cols-4">
            {team.slice(0, 4).map((m) => (
              <li key={m.id}>
                <TeamCard member={m} compact />
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {/* Content */}
      {showcaseContent.length ? (
        <Section aria-labelledby="content-title" className="border-t border-border">
          <SectionHeading
            id="content-title"
            eyebrow="Creator"
            title="We teach what we build"
            description="Tutorials, build breakdowns and experiments from our content channels."
            action={
              <Link href="/content" className={buttonVariants({ variant: "outline", size: "sm" })}>
                All content
              </Link>
            }
          />
          <ul className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {showcaseContent.map((c) => (
              <li key={c.id}>
                <ContentCard item={c} />
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {/* CTAs */}
      <Section className="border-t border-border" aria-label="Get in touch">
        <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <div className="relative overflow-hidden rounded-card border border-border bg-surface p-8 sm:p-12">
            <div aria-hidden className="pointer-events-none absolute -right-20 -bottom-24 size-72 rounded-full bg-accent-2/15 blur-3xl" />
            <h2 className="relative text-2xl font-semibold sm:text-3xl">Have a process worth automating?</h2>
            <p className="relative mt-3 max-w-xl text-muted">Tell us what slows your team down. We&apos;ll reply with an honest view of what AI and automation can — and can&apos;t — do for it.</p>
            <Link href="/contact" className={buttonVariants({ size: "lg", className: "relative mt-8" })}>
              Start a project <ArrowRight aria-hidden />
            </Link>
          </div>
          <div className="rounded-card border border-border bg-surface/60 p-8 sm:p-10">
            <p className="eyebrow">Partnerships</p>
            <h2 className="mt-3 text-xl font-semibold">Brands & sponsors</h2>
            <p className="mt-3 text-sm text-muted">Collaborate with us on content for builders, founders and operators.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/sponsorship" className={buttonVariants({ variant: "secondary" })}>
                Sponsorship
              </Link>
              <Link href="/media-kit" className={buttonVariants({ variant: "ghost" })}>
                Media kit
              </Link>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
