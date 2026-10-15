import { ArrowRight, Code2, ExternalLink, FileText, FolderKanban, Globe, Layers, ShieldCheck, Users, Video } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { JsonLd } from "@/components/site/json-ld";
import { PageHeader, Section } from "@/components/site/section";
import { breadcrumbLd } from "@/lib/jsonld";
import { buildMetadata } from "@/lib/seo";
import { listPublishedContent } from "@/server/dal/public/content";
import { listPublishedProjects } from "@/server/dal/public/projects";
import { listPublishedServices } from "@/server/dal/public/services";
import { getPublicSettings } from "@/server/dal/public/site";
import { listPublishedTeam } from "@/server/dal/public/team";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const { general } = await getPublicSettings();
  return buildMetadata({
    title: `Sitemap — ${general.siteName}`,
    description: `Complete visual directory of ${general.siteName}. Browse all agency services, client case studies, tutorials, legal policies, and machine-readable feeds.`,
    path: "/sitemap",
  });
}

export default async function SitemapPage() {
  const [{ general }, services, projects, team, content] = await Promise.all([
    getPublicSettings(),
    listPublishedServices(),
    listPublishedProjects(),
    listPublishedTeam(),
    listPublishedContent(),
  ]);

  const corePages = [
    { label: "Home", href: "/", description: "Agency introduction, featured projects, and client testimonials." },
    { label: "Services", href: "/services", description: "AI engineering, workflow automation, and technical creator services." },
    { label: "Our Work", href: "/projects", description: "Case studies and portfolio of delivered AI and automation systems." },
    { label: "Tutorials & Content", href: "/content", description: "Engineering tutorials, video walkthroughs, and practical guides." },
    { label: "Team", href: "/team", description: "Founders and engineers behind AI With Hamad." },
    { label: "About", href: "/about", description: "Our mission, technical principles, and studio background." },
    { label: "Sponsorship & Brands", href: "/sponsorship", description: "Partner with our creator channels and engineering audience." },
    { label: "Media Kit", href: "/media-kit", description: "Audience demographics, content reach, and partnership metrics." },
    { label: "Contact Us", href: "/contact", description: "Get in touch for project inquiries, consulting, or speaking." },
    { label: "All Links", href: "/links", description: "Central link-in-bio hub for socials, communities, and tools." },
    { label: "Client Portal", href: "/portal/login", description: "Secure project dashboard for clients and collaborators." },
  ];

  const legalPages = [
    { label: "Privacy Policy", href: "/privacy-policy", description: "Information collection, retention, and your privacy rights." },
    { label: "Terms of Service", href: "/terms", description: "Rules governing use of our website and digital resources." },
    { label: "Cookie Policy", href: "/cookie-policy", description: "Details on cookieless analytics and necessary security cookies." },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Directory"
        title="Sitemap"
        description={`Explore the complete structure of ${general.siteName}. Discover services, client case studies, tutorials, and legal documents.`}
      />

      <Section>
        {/* Machine-readable callout */}
        <div className="mb-12 rounded-card glass-panel p-6 sm:p-8 border border-(--glass-line) shadow-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          <div className="flex items-start gap-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-control bg-accent-soft text-accent">
              <Code2 className="size-5" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-fg">Machine-Readable XML Sitemap</h2>
              <p className="mt-1 text-sm text-muted max-w-xl">
                Looking for the search-engine index? Our dynamic XML sitemap is automatically updated every hour and conforms to the Sitemaps protocol.
              </p>
            </div>
          </div>
          <a
            href="/sitemap.xml"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-button bg-accent px-5 py-2.5 text-sm font-semibold text-accent-fg shadow-glow transition-transform hover:scale-[1.02] active:scale-[0.98] self-start sm:self-auto shrink-0"
          >
            View /sitemap.xml
            <ExternalLink className="size-4" />
          </a>
        </div>

        <div className="space-y-14">
          {/* Main Pages */}
          <div>
            <div className="flex items-center gap-2.5 mb-6">
              <Globe className="size-5 text-accent" />
              <h2 className="text-xl font-semibold text-fg">Main Pages</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {corePages.map((page) => (
                <Link
                  key={page.href}
                  href={page.href}
                  className="group rounded-card glass-card p-5 border border-(--glass-line) transition-[transform,background-color,border-color] duration-(--duration-base) hover:-translate-y-0.5 hover:border-accent/40"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-fg group-hover:text-accent transition-colors">{page.label}</span>
                    <ArrowRight className="size-4 text-subtle transition-transform group-hover:translate-x-1 group-hover:text-accent" />
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted">{page.description}</p>
                </Link>
              ))}
            </div>
          </div>

          {/* Agency Services */}
          {services.length > 0 ? (
            <div>
              <div className="flex items-center gap-2.5 mb-6">
                <Layers className="size-5 text-accent" />
                <h2 className="text-xl font-semibold text-fg">Agency Services ({services.length})</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {services.map((service) => (
                  <Link
                    key={service.slug}
                    href={`/services/${service.slug}`}
                    className="group rounded-card glass-card p-5 border border-(--glass-line) transition-[transform,background-color,border-color] duration-(--duration-base) hover:-translate-y-0.5 hover:border-accent/40"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-fg group-hover:text-accent transition-colors">{service.title}</span>
                      <ArrowRight className="size-4 text-subtle transition-transform group-hover:translate-x-1 group-hover:text-accent" />
                    </div>
                    {service.summary ? (
                      <p className="mt-1.5 text-xs leading-relaxed text-muted line-clamp-2">{service.summary}</p>
                    ) : null}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

          {/* Client Case Studies */}
          {projects.length > 0 ? (
            <div>
              <div className="flex items-center gap-2.5 mb-6">
                <FolderKanban className="size-5 text-accent" />
                <h2 className="text-xl font-semibold text-fg">Client Case Studies ({projects.length})</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {projects.map((project) => (
                  <Link
                    key={project.slug}
                    href={`/projects/${project.slug}`}
                    className="group rounded-card glass-card p-5 border border-(--glass-line) transition-[transform,background-color,border-color] duration-(--duration-base) hover:-translate-y-0.5 hover:border-accent/40"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-fg group-hover:text-accent transition-colors">{project.title}</span>
                      <ArrowRight className="size-4 text-subtle transition-transform group-hover:translate-x-1 group-hover:text-accent" />
                    </div>
                    {project.client ? (
                      <p className="mt-1 text-[0.8125rem] font-medium text-accent">{project.client}</p>
                    ) : null}
                    {project.summary ? (
                      <p className="mt-1.5 text-xs leading-relaxed text-muted line-clamp-2">{project.summary}</p>
                    ) : null}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

          {/* Tutorials & Content */}
          {content.length > 0 ? (
            <div>
              <div className="flex items-center gap-2.5 mb-6">
                <Video className="size-5 text-accent" />
                <h2 className="text-xl font-semibold text-fg">Tutorials & Creator Content ({content.length})</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {content.map((item) => (
                  <Link
                    key={item.slug}
                    href={`/content/${item.slug}`}
                    className="group rounded-card glass-card p-5 border border-(--glass-line) transition-[transform,background-color,border-color] duration-(--duration-base) hover:-translate-y-0.5 hover:border-accent/40"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-fg group-hover:text-accent transition-colors line-clamp-1">{item.title}</span>
                      <ArrowRight className="size-4 shrink-0 text-subtle transition-transform group-hover:translate-x-1 group-hover:text-accent" />
                    </div>
                    {item.summary ? (
                      <p className="mt-1.5 text-xs leading-relaxed text-muted line-clamp-2">{item.summary}</p>
                    ) : null}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

          {/* Team Members */}
          {team.length > 0 ? (
            <div>
              <div className="flex items-center gap-2.5 mb-6">
                <Users className="size-5 text-accent" />
                <h2 className="text-xl font-semibold text-fg">Team & Leadership ({team.length})</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {team.map((member) => (
                  <Link
                    key={member.slug}
                    href={`/team/${member.slug}`}
                    className="group rounded-card glass-card p-5 border border-(--glass-line) transition-[transform,background-color,border-color] duration-(--duration-base) hover:-translate-y-0.5 hover:border-accent/40"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-fg group-hover:text-accent transition-colors">{member.name}</span>
                      <ArrowRight className="size-4 text-subtle transition-transform group-hover:translate-x-1 group-hover:text-accent" />
                    </div>
                    <p className="mt-1 text-xs text-muted">{member.role}</p>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

          {/* Legal & Compliance */}
          <div>
            <div className="flex items-center gap-2.5 mb-6">
              <ShieldCheck className="size-5 text-accent" />
              <h2 className="text-xl font-semibold text-fg">Legal & Policies</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {legalPages.map((page) => (
                <Link
                  key={page.href}
                  href={page.href}
                  className="group rounded-card glass-card p-5 border border-(--glass-line) transition-[transform,background-color,border-color] duration-(--duration-base) hover:-translate-y-0.5 hover:border-accent/40"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-fg group-hover:text-accent transition-colors">{page.label}</span>
                    <ArrowRight className="size-4 text-subtle transition-transform group-hover:translate-x-1 group-hover:text-accent" />
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted">{page.description}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <JsonLd
        data={breadcrumbLd([
          { name: "Home", path: "/" },
          { name: "Sitemap", path: "/sitemap" },
        ])}
      />
    </>
  );
}
