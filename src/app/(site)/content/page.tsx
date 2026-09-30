import { PlaySquare, Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { ContentCard } from "@/components/site/content-card";
import { JsonLd } from "@/components/site/json-ld";
import { NewsletterForm } from "@/components/site/newsletter-form";
import { PlatformCards } from "@/components/site/platform-cards";
import { EmptyState, PageHeader, Section, SectionHeading } from "@/components/site/section";
import { contentPlatform, type ContentPlatform } from "@/db/schema";
import { breadcrumbLd } from "@/lib/jsonld";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { buildMetadata } from "@/lib/seo";
import { safeHref } from "@/lib/url-safety";
import { cn } from "@/lib/utils";
import { getContentFacets, groupContent, listActivePlatforms, listPublishedContent, PLATFORM_LABELS } from "@/server/dal/public/content";
import { getPublicSettings } from "@/server/dal/public/site";

export async function generateMetadata(props: PageProps<"/content">): Promise<Metadata> {
  const sp = await props.searchParams;
  return {
    ...buildMetadata({
      title: "Content",
      description: "Tutorials, build breakdowns and experiments about AI engineering and automation across YouTube, TikTok, Instagram and LinkedIn.",
      path: "/content",
    }),
    ...(sp.platform || sp.category || sp.q ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function ContentPage(props: PageProps<"/content">) {
  const sp = await props.searchParams;
  const platform = (contentPlatform.enumValues as readonly string[]).includes(String(sp.platform)) ? (sp.platform as ContentPlatform) : undefined;
  const category = typeof sp.category === "string" ? sp.category : undefined;
  const q = typeof sp.q === "string" ? sp.q.slice(0, 100) : undefined;
  const filtered = Boolean(platform || category || q);
  const [all, items, platforms, categories, { content }] = await Promise.all([
    filtered ? listPublishedContent() : Promise.resolve([]),
    listPublishedContent({ platform, category, q }),
    listActivePlatforms(),
    getContentFacets(),
    getPublicSettings(),
  ]);
  const available = [...new Set((filtered ? all : items).map((i) => i.platform))];
  const highPerforming = filtered ? [] : groupContent(items, "high-performing", 3);
  const chip = (active: boolean) =>
    cn("pressable inline-flex min-h-9 items-center rounded-full px-3.5 text-sm whitespace-nowrap", active ? "bg-fg font-medium text-bg shadow-card" : "bg-fg/[0.05] text-muted hover:bg-fg/[0.08] hover:text-fg");
  const contributeHref = safeHref(content.contributeUrl);
  return (
    <>
      <PageHeader eyebrow="Videos & tutorials" title="Tutorials" description="We teach what we build: tutorials, walkthroughs and honest experiments with AI tools." />
      {platforms.length && !filtered ? (
        <Section aria-labelledby="platforms-title">
          <SectionHeading id="platforms-title" eyebrow="Channels" title="Where to follow" />
          <PlatformCards platforms={platforms} />
        </Section>
      ) : null}
      {highPerforming.length ? (
        <Section aria-labelledby="top-title">
          <SectionHeading id="top-title" eyebrow="Top performing" title="Audience favourites" />
          <ul data-reveal="group" className="focus-group grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {highPerforming.map((c) => <li key={c.id}><ContentCard item={c} /></li>)}
          </ul>
        </Section>
      ) : null}
      <Section aria-labelledby="all-content">
        <SectionHeading id="all-content" eyebrow="Library" title={platform ? `${PLATFORM_LABELS[platform]} content` : "All content"} />
        <form action="/content" method="get" className="mb-6 max-w-sm">
          <label htmlFor="content-search" className="sr-only">Search content</label>
          <div className="relative">
            <Search aria-hidden className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-subtle" />
            <Input id="content-search" name="q" type="search" defaultValue={q} placeholder="Search tutorials…" className="pl-10" />
          </div>
          {platform ? <input type="hidden" name="platform" value={platform} /> : null}
          {category ? <input type="hidden" name="category" value={category} /> : null}
        </form>
        {available.length > 1 ? (
          <nav aria-label="Filter by platform" className="-mx-5 mb-4 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
            <Link href="/content" className={chip(!platform)} aria-current={!platform ? "true" : undefined}>All</Link>
            {available.map((p) => (
              <Link key={p} href={`/content?platform=${p}`} className={chip(platform === p)} aria-current={platform === p ? "true" : undefined}>{PLATFORM_LABELS[p]}</Link>
            ))}
          </nav>
        ) : null}
        {categories.length ? (
          <nav aria-label="Filter by category" className="-mx-5 mb-10 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
            <Link href="/content" className={chip(!category)} aria-current={!category ? "true" : undefined}>All topics</Link>
            {categories.map((c) => (
              <Link key={c} href={`/content?category=${encodeURIComponent(c)}`} className={chip(category === c)} aria-current={category === c ? "true" : undefined}>{c}</Link>
            ))}
          </nav>
        ) : null}
        {items.length ? (
          <ul data-reveal="group" className="focus-group grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((c) => <li key={c.id}><ContentCard item={c} /></li>)}
          </ul>
        ) : (
          <EmptyState
            title={filtered ? "Nothing matches" : "New content is on the way"}
            icon={<PlaySquare />}
            actions={<Link href="/links" className={buttonVariants({ variant: "secondary" })}>Follow our channels</Link>}
          >
            {filtered ? "Try a different search or clear the filters." : "Tutorials and build breakdowns are published here as they go live."}
          </EmptyState>
        )}
      </Section>
      <Section aria-label="Stay updated">
        <div data-reveal="item" className="glass-panel flex flex-col items-start gap-6 rounded-[2rem] p-8 sm:flex-row sm:items-center sm:justify-between sm:p-10">
          <div>
            <h2 className="text-2xl">Get new tutorials by email</h2>
            <p className="mt-2 max-w-md text-muted">No spam — just new builds and breakdowns as we publish them.</p>
          </div>
          <div className="w-full shrink-0 sm:w-80">
            <NewsletterForm />
          </div>
        </div>
      </Section>
      {contributeHref && content.contributeBody ? (
        <Section>
          <div data-reveal="item" className="glass-card flex flex-col items-start gap-6 rounded-[2rem] p-8 sm:flex-row sm:items-center sm:justify-between sm:p-10">
            <div>
              <h2 className="text-xl">Want to contribute?</h2>
              <p className="mt-2 max-w-md text-muted">{content.contributeBody}</p>
            </div>
            <a href={contributeHref} target={contributeHref.startsWith("/") ? undefined : "_blank"} rel={contributeHref.startsWith("/") ? undefined : "noopener noreferrer"} className={buttonVariants({ variant: "secondary", className: "shrink-0" })}>
              Get in touch
            </a>
          </div>
        </Section>
      ) : null}
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Content", path: "/content" }])} />
    </>
  );
}
