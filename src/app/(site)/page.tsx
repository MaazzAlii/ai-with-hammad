import { ArrowRight, MessageCircle, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { AgentVisual } from "@/components/site/agent-visual";
import { ContentCard } from "@/components/site/content-card";
import { FaqList } from "@/components/site/faq";
import { MediaImage } from "@/components/site/media-image";
import { ProjectCard } from "@/components/site/project-card";
import { Section, SectionHeading, ViewAllLink } from "@/components/site/section";
import { ServiceCard } from "@/components/site/service-card";
import { TeamCard } from "@/components/site/team-card";
import { TechMarquee } from "@/components/site/tech-marquee";
import { TestimonialGrid } from "@/components/site/testimonials";
import { Stars } from "@/components/portal/star-rating";
import { buttonVariants } from "@/components/ui/button";
import { buildMetadata } from "@/lib/seo";
import { safeHref } from "@/lib/url-safety";
import { whatsappLink } from "@/lib/whatsapp";
import { groupContent, listPublishedContent } from "@/server/dal/public/content";
import { listHomepageProjects } from "@/server/dal/public/projects";
import { getServiceFeatureTitles, listPublishedServices } from "@/server/dal/public/services";
import { getPublicSettings, getSiteMedia } from "@/server/dal/public/site";
import { listPublishedTeam } from "@/server/dal/public/team";
import { averageRating, listPublishedFaqs, listPublishedTestimonials } from "@/server/dal/public/testimonials";

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

const arrow = "transition-transform duration-(--duration-base) ease-spring group-hover/btn:translate-x-0.5";

export default async function HomePage() {
  const [settings, media, services, projects, team, content, testimonials, faqs] = await Promise.all([
    getPublicSettings(),
    getSiteMedia(),
    listPublishedServices(),
    listHomepageProjects(6),
    listPublishedTeam({ featuredOnly: true }),
    listPublishedContent(),
    listPublishedTestimonials({ limit: 6 }),
    listPublishedFaqs(),
  ]);
  const allTestimonials = testimonials.length ? await listPublishedTestimonials() : [];
  const avg = averageRating(allTestimonials);
  const { home, general } = settings;
  const featureTitles = await getServiceFeatureTitles(services.map((s) => s.id));
  const highlighted = groupContent(content, "high-performing", 3);
  const showcaseContent = highlighted.length ? highlighted : groupContent(content, "featured", 3).length ? groupContent(content, "featured", 3) : groupContent(content, "latest", 3);
  const primaryHref = safeHref(home.primaryCtaHref) ?? "/contact";
  const secondaryHref = safeHref(home.secondaryCtaHref) ?? "/projects";
  const wa = whatsappLink(general.whatsapp, general.whatsappMessage);

  return (
    <>
      {/* Hero */}
      <section aria-labelledby="hero-title">
        <div className="container-page grid items-center gap-16 pt-10 pb-20 sm:pt-16 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12 lg:pt-20 lg:pb-28">
          <div>
            {home.heroEyebrow ? (
              <p className="glass-card inline-flex items-center gap-2 rounded-full py-1 pr-3.5 pl-1 text-[0.8125rem] font-medium text-fg">
                <span className="grid size-6 place-items-center rounded-full bg-accent-soft text-accent">
                  <Sparkles aria-hidden className="size-3.5" />
                </span>
                {home.heroEyebrow}
              </p>
            ) : null}
            <h1 id="hero-title" className="text-gradient mt-6 max-w-[15ch] pb-1 text-[2.75rem] sm:text-6xl xl:text-[4.25rem]">
              {home.heroTitle}
            </h1>
            {home.heroSubtitle ? <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted sm:text-xl">{home.heroSubtitle}</p> : null}
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Link href={primaryHref} className={buttonVariants({ size: "lg", className: "group/btn" })}>
                {home.primaryCtaLabel}
                <ArrowRight aria-hidden className={arrow} />
              </Link>
              <Link href={secondaryHref} className={buttonVariants({ size: "lg", variant: "secondary" })}>
                {home.secondaryCtaLabel}
              </Link>
              {wa ? (
                <a href={wa} target="_blank" rel="noopener noreferrer" className={buttonVariants({ size: "lg", variant: "ghost" })}>
                  <MessageCircle aria-hidden /> WhatsApp us
                </a>
              ) : null}
            </div>
            {avg && allTestimonials.length ? (
              <p className="mt-9 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-muted">
                <Stars rating={avg} />
                <span>
                  <span className="font-medium text-fg tabular-nums">{avg.toFixed(1)}</span> average from {allTestimonials.length} client review{allTestimonials.length === 1 ? "" : "s"}
                </span>
              </p>
            ) : null}
          </div>
          <div>
            {media.heroImage ? (
              <div className="glass-panel rounded-[1.75rem] p-2">
                <MediaImage media={media.heroImage} ratio="4/3" priority sizes="(min-width: 1024px) 45vw, 100vw" className="rounded-[1.25rem]" />
              </div>
            ) : (
              <AgentVisual />
            )}
          </div>
        </div>
        {home.techStack.length ? (
          <div className="container-page pb-6">
            <p className="label-caps mb-5 text-center">Built with</p>
            <TechMarquee items={home.techStack} />
          </div>
        ) : null}
      </section>

      {/* Positioning */}
      {home.positioningTitle ? (
        <Section aria-labelledby="positioning-title">
          <div data-reveal="item" className="grid gap-6 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
            <div>
              <p className="eyebrow mb-3">Who we are</p>
              <h2 id="positioning-title" className="text-[1.75rem] sm:text-[2.5rem]">
                {home.positioningTitle}
              </h2>
            </div>
            <div className="lg:pt-9">
              <p className="text-lg leading-relaxed text-muted sm:text-xl">{home.positioningBody}</p>
              <Link href="/about" className={buttonVariants({ variant: "link", className: "group/btn mt-5 text-[0.9375rem]" })}>
                About {general.siteName}
                <ArrowRight aria-hidden className={arrow} />
              </Link>
            </div>
          </div>
        </Section>
      ) : null}

      {/* Services */}
      {services.length ? (
        <Section aria-labelledby="services-title">
          <SectionHeading
            id="services-title"
            eyebrow="Services"
            title="What we build"
            description="Scoped engagements — from one automated workflow to agent systems that run part of your operations."
            action={<ViewAllLink href="/services">All services</ViewAllLink>}
          />
          <ul data-reveal="group" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
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
        <Section aria-labelledby="work-title">
          <SectionHeading
            id="work-title"
            eyebrow="Selected work"
            title="Case studies"
            description="The problem, how we approached it, what we built — and what changed afterwards."
            action={<ViewAllLink href="/projects">All projects</ViewAllLink>}
          />
          <ul data-reveal="group" className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p, i) => (
              <li key={p.id}>
                <ProjectCard project={p} priority={i === 0 && !media.heroImage} />
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {/* Capabilities: one panel, divided into cells */}
      {home.capabilities.length ? (
        <Section aria-labelledby="capabilities-title" className="cv-auto">
          <SectionHeading id="capabilities-title" eyebrow="Engineering" title="How we build" />
          <ul data-reveal="item" className="glass-panel grid gap-px overflow-hidden rounded-card bg-(--glass-line) sm:grid-cols-2 lg:grid-cols-4">
            {home.capabilities.map((c) => (
              <li key={c.title} className="bg-surface/60 p-6 sm:p-7 dark:bg-bg/40">
                <h3 className="text-base font-semibold tracking-tight text-fg">{c.title}</h3>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">{c.body}</p>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {/* Process */}
      {home.process.length ? (
        <Section aria-labelledby="process-title" className="cv-auto">
          <SectionHeading id="process-title" eyebrow="Process" title="From first call to handover" />
          <ol data-reveal="group" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

      {/* Team */}
      {team.length ? (
        <Section aria-labelledby="team-title" className="cv-auto">
          <SectionHeading id="team-title" eyebrow="People" title="The engineers behind the work" action={<ViewAllLink href="/team">Meet the team</ViewAllLink>} />
          <ul data-reveal="group" className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-4">
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
        <Section aria-labelledby="content-title" className="cv-auto">
          <SectionHeading
            id="content-title"
            eyebrow="Content"
            title="We teach what we build"
            description="Tutorials, build breakdowns and experiments from our channels."
            action={<ViewAllLink href="/content">All content</ViewAllLink>}
          />
          <ul data-reveal="group" className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {showcaseContent.map((c) => (
              <li key={c.id}>
                <ContentCard item={c} />
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {/* Testimonials */}
      {testimonials.length ? (
        <Section aria-labelledby="testimonials-title" className="cv-auto">
          <SectionHeading
            id="testimonials-title"
            eyebrow="Client feedback"
            title="In their words"
            description={avg ? `Rated ${avg.toFixed(1)} out of 5 by ${allTestimonials.length} client${allTestimonials.length === 1 ? "" : "s"}, collected through our client portal.` : undefined}
            action={<ViewAllLink href="/testimonials">All testimonials</ViewAllLink>}
          />
          <TestimonialGrid items={testimonials} />
        </Section>
      ) : null}

      {/* FAQ */}
      {faqs.length ? (
        <Section aria-labelledby="faq-title" className="cv-auto">
          <div className="grid gap-2 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
            <SectionHeading id="faq-title" eyebrow="FAQ" title="Common questions" description="Something else on your mind? Ask us on WhatsApp or through the contact form." />
            <FaqList items={faqs.slice(0, 6)} />
          </div>
        </Section>
      ) : null}

      {/* Closing calls to action */}
      <Section aria-label="Get in touch">
        <div data-reveal="group" className="grid gap-4 lg:grid-cols-[1.5fr_1fr] lg:gap-5">
          <div className="glass-panel relative isolate overflow-hidden rounded-[2rem] p-8 sm:p-12">
            <div aria-hidden className="absolute -right-24 -bottom-32 -z-10 size-96 rounded-full bg-[radial-gradient(closest-side,var(--ambient-1),transparent)]" />
            <h2 className="max-w-md text-[1.75rem] sm:text-[2.25rem]">Have a process worth automating?</h2>
            <p className="mt-4 max-w-lg text-[1.0625rem] leading-relaxed text-muted">
              Tell us what slows your team down. We&apos;ll reply with an honest view of what AI and automation can — and can&apos;t — do for it.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href="/contact" className={buttonVariants({ size: "lg", className: "group/btn" })}>
                Start a project
                <ArrowRight aria-hidden className={arrow} />
              </Link>
              {wa ? (
                <a href={wa} target="_blank" rel="noopener noreferrer" className={buttonVariants({ size: "lg", variant: "secondary" })}>
                  <MessageCircle aria-hidden /> Chat on WhatsApp
                </a>
              ) : null}
            </div>
          </div>
          <div className="glass-card flex flex-col rounded-[2rem] p-8 sm:p-10">
            <p className="eyebrow">Partnerships</p>
            <h2 className="mt-2 text-xl">Brands and sponsors</h2>
            <p className="mt-3 flex-1 text-[0.9375rem] leading-relaxed text-muted">Work with us on content for builders, founders and operators.</p>
            <div className="mt-8 flex flex-wrap gap-2">
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
