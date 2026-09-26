import { PlaySquare } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { ContentCard } from "@/components/site/content-card";
import { JsonLd } from "@/components/site/json-ld";
import { PlatformCards } from "@/components/site/platform-cards";
import { EmptyState, PageHeader, Section, SectionHeading } from "@/components/site/section";
import { contentPlatform, type ContentPlatform } from "@/db/schema";
import { breadcrumbLd } from "@/lib/jsonld";
import { buttonVariants } from "@/components/ui/button";
import { buildMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";
import { groupContent, listActivePlatforms, listPublishedContent, PLATFORM_LABELS } from "@/server/dal/public/content";

export async function generateMetadata(props: PageProps<"/content">): Promise<Metadata> {
  const sp = await props.searchParams;
  return {
    ...buildMetadata({
      title: "Content",
      description: "Tutorials, build breakdowns and experiments about AI engineering and automation across YouTube, TikTok, Instagram and LinkedIn.",
      path: "/content",
    }),
    ...(sp.platform ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function ContentPage(props: PageProps<"/content">) {
  const sp = await props.searchParams;
  const platform = (contentPlatform.enumValues as readonly string[]).includes(String(sp.platform)) ? (sp.platform as ContentPlatform) : undefined;
  const [all, platforms] = await Promise.all([listPublishedContent(), listActivePlatforms()]);
  const items = platform ? all.filter((i) => i.platform === platform) : all;
  const available = [...new Set(all.map((i) => i.platform))];
  const highPerforming = platform ? [] : groupContent(all, "high-performing", 3);
  const chip = (active: boolean) =>
    cn("pressable inline-flex min-h-9 items-center rounded-full px-3.5 text-sm whitespace-nowrap", active ? "bg-fg font-medium text-bg shadow-card" : "bg-fg/[0.05] text-muted hover:bg-fg/[0.08] hover:text-fg");
  return (
    <>
      <PageHeader eyebrow="Videos & tutorials" title="Tutorials" description="We teach what we build: tutorials, walkthroughs and honest experiments with AI tools." />
      {platforms.length && !platform ? (
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
        {available.length > 1 ? (
          <nav aria-label="Filter by platform" className="-mx-5 mb-10 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
            <Link href="/content" className={chip(!platform)} aria-current={!platform ? "true" : undefined}>All</Link>
            {available.map((p) => (
              <Link key={p} href={`/content?platform=${p}`} className={chip(platform === p)} aria-current={platform === p ? "true" : undefined}>{PLATFORM_LABELS[p]}</Link>
            ))}
          </nav>
        ) : null}
        {items.length ? (
          <ul data-reveal="group" className="focus-group grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((c) => <li key={c.id}><ContentCard item={c} /></li>)}
          </ul>
        ) : (
          <EmptyState
            title="New content is on the way"
            icon={<PlaySquare />}
            actions={<Link href="/links" className={buttonVariants({ variant: "secondary" })}>Follow our channels</Link>}
          >
            Tutorials and build breakdowns are published here as they go live.
          </EmptyState>
        )}
      </Section>
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Content", path: "/content" }])} />
    </>
  );
}
