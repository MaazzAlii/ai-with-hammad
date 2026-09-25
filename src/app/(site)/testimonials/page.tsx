import { MessageSquareQuote } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Stars } from "@/components/portal/star-rating";
import { JsonLd } from "@/components/site/json-ld";
import { EmptyState, PageHeader, Section } from "@/components/site/section";
import { TestimonialGrid } from "@/components/site/testimonials";
import { buttonVariants } from "@/components/ui/button";
import { breadcrumbLd } from "@/lib/jsonld";
import { buildMetadata } from "@/lib/seo";
import { getPublicSettings } from "@/server/dal/public/site";
import { averageRating, listPublishedTestimonials } from "@/server/dal/public/testimonials";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const { general } = await getPublicSettings();
  return buildMetadata({ title: "Client testimonials", description: `What clients say about working with ${general.siteName}: ratings and feedback collected through our client portal.`, path: "/testimonials" });
}

/**
 * No Review/AggregateRating structured data: Google does not show self-serving
 * reviews for an organization's own site, so the ratings are shown visibly only.
 */
export default async function TestimonialsPage() {
  const items = await listPublishedTestimonials();
  const avg = averageRating(items);
  return (
    <>
      <PageHeader eyebrow="Client feedback" title="Testimonials" description="Every testimonial here was submitted by a client (or given to us directly) and published with their permission.">
        {avg ? (
          <p className="glass-card mt-8 inline-flex items-center gap-3 rounded-full py-2 pr-4 pl-3 text-sm text-muted">
            <Stars rating={avg} />
            <span>
              <span className="font-semibold text-fg tabular-nums">{avg.toFixed(1)}</span> out of 5 from {items.length} review{items.length === 1 ? "" : "s"}
            </span>
          </p>
        ) : null}
      </PageHeader>
      <Section>
        {items.length ? <TestimonialGrid items={items} /> : <EmptyState title="Testimonials coming soon" icon={<MessageSquareQuote />}>We publish client feedback after projects are delivered.</EmptyState>}
        <div className="mt-14 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <Link href="/contact" className={buttonVariants({ size: "lg" })}>Start a project</Link>
          <Link href="/portal/login" className={buttonVariants({ size: "lg", variant: "ghost" })}>Client? Leave feedback</Link>
        </div>
      </Section>
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Testimonials", path: "/testimonials" }])} />
    </>
  );
}
