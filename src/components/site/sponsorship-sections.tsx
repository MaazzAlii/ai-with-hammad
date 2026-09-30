import { ArrowUpRight, Check } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatCompactNumber, formatDate } from "@/lib/utils";
import { PLATFORM_LABELS, type ContentCardDTO, type PlatformDTO } from "@/server/dal/public/content";
import type { PackageDTO, PartnerDTO, SponsorTestimonialDTO } from "@/server/dal/public/sponsorship";
import type { PublicSettings } from "@/server/dal/public/site";

import { AudienceBars } from "./audience-bars";
import { ContentCard } from "./content-card";
import { MediaImage } from "./media-image";
import { PlatformCards } from "./platform-cards";
import { SectionHeading } from "./section";
import { Stars } from "../portal/star-rating";

/** Shared blocks used by /sponsorship and /media-kit. Every block hides itself when its data is empty. */

export function hasAudienceData(s: PublicSettings["sponsorship"], platforms: PlatformDTO[]) {
  const a = s.audience;
  return Boolean(
    s.audienceSummary || a.ageRanges.length || a.topCountries.length || a.genderSplit.length || a.jobTitles.length || platforms.some((p) => p.followers != null) || s.monthlyViews != null || s.avgOpenRate,
  );
}

export function AudienceBlock({ s, platforms }: { s: PublicSettings["sponsorship"]; platforms: PlatformDTO[] }) {
  const a = s.audience;
  const hasBreakdown = a.ageRanges.length || a.topCountries.length || a.genderSplit.length || a.jobTitles.length;
  const totalFollowers = platforms.reduce((n, p) => n + (p.followers ?? 0), 0);
  const withFollowers = platforms.filter((p) => p.followers != null);
  const hasStats = s.monthlyViews != null || s.avgOpenRate;
  if (!s.audienceSummary && !hasBreakdown && !withFollowers.length && !hasStats) return null;
  return (
    <div className="print-avoid">
      <SectionHeading eyebrow="Audience" title="Who watches" description={s.audienceSummary || undefined} />
      {withFollowers.length || hasStats ? (
        <div className="mb-6 flex flex-wrap gap-x-10 gap-y-4">
          {withFollowers.length ? (
            <p className="text-muted">
              <span className="mr-1 text-[2.5rem] leading-none font-semibold tracking-tight text-fg tabular-nums">{formatCompactNumber(totalFollowers)}</span> combined followers across {withFollowers.length} platform{withFollowers.length === 1 ? "" : "s"}
            </p>
          ) : null}
          {s.monthlyViews != null ? (
            <p className="text-muted"><span className="mr-1 text-[2.5rem] leading-none font-semibold tracking-tight text-fg tabular-nums">{formatCompactNumber(s.monthlyViews)}</span> monthly views</p>
          ) : null}
          {s.avgOpenRate ? (
            <p className="text-muted"><span className="mr-1 text-[2.5rem] leading-none font-semibold tracking-tight text-fg tabular-nums">{s.avgOpenRate}</span> avg. open rate</p>
          ) : null}
        </div>
      ) : null}
      {hasBreakdown ? (
        <div data-reveal="group" className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <AudienceBars title="Age" rows={a.ageRanges} />
          <AudienceBars title="Top countries" rows={a.topCountries} />
          <AudienceBars title="Gender" rows={a.genderSplit} />
          <AudienceBars title="Job titles" rows={a.jobTitles} />
        </div>
      ) : null}
      {a.asOf && hasBreakdown ? <p className="mt-3 text-xs text-subtle">Audience data as of {formatDate(a.asOf)}.</p> : null}
    </div>
  );
}

export function CategoriesBlock({ categories }: { categories: string[] }) {
  if (!categories.length) return null;
  return (
    <div className="print-avoid">
      <SectionHeading eyebrow="Topics" title="Content categories" />
      <ul className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <li key={c}><Badge variant="accent" className="px-3.5 py-1.5 text-sm">{c}</Badge></li>
        ))}
      </ul>
    </div>
  );
}

export function PlatformsBlock({ platforms }: { platforms: PlatformDTO[] }) {
  if (!platforms.length) return null;
  return (
    <div>
      <SectionHeading eyebrow="Reach" title="Platforms" />
      <PlatformCards platforms={platforms} />
    </div>
  );
}

export function TopContentBlock({ items, title = "Selected content" }: { items: ContentCardDTO[]; title?: string }) {
  if (!items.length) return null;
  return (
    <div>
      <SectionHeading eyebrow="Performance" title={title} />
      <ul data-reveal="group" className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((c) => <li key={c.id} className="print-avoid"><ContentCard item={c} /></li>)}
      </ul>
    </div>
  );
}

export function PartnersBlock({ partners }: { partners: PartnerDTO[] }) {
  if (!partners.length) return null;
  return (
    <div>
      <SectionHeading eyebrow="Track record" title="Previous partnerships" />
      <ul data-reveal="group" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {partners.map((p) => (
          <li key={p.slug} className="print-avoid glass-card flex flex-col rounded-card p-6">
            <div className="flex items-center gap-3">
              {p.logo ? <MediaImage media={p.logo} alt={`${p.name} logo`} ratio="1/1" rounded={false} className="size-10 shrink-0 rounded-control bg-surface" imgClassName="object-contain p-1" sizes="40px" /> : null}
              <div>
                <h3 className="font-semibold text-fg">{p.name}</h3>
                {p.partneredOn ? <p className="text-xs text-subtle">{formatDate(p.partneredOn, { day: undefined })}</p> : null}
              </div>
            </div>
            {p.campaignSummary || p.description ? <p className="mt-3 flex-1 text-sm text-muted">{p.campaignSummary || p.description}</p> : null}
            {p.resultHeadline ? <p className="mt-3 text-sm font-medium text-accent">{p.resultHeadline}</p> : null}
            {p.websiteUrl ? (
              <a href={p.websiteUrl} target="_blank" rel="noopener noreferrer" className="no-print group mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent">
                Website <ArrowUpRight aria-hidden className="size-3.5 transition-transform duration-(--duration-base) ease-spring group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function FormatsBlock({ formats, packages, ratesNotice }: { formats: { title: string; body: string }[]; packages: PackageDTO[]; ratesNotice: string }) {
  if (!formats.length && !packages.length) return null;
  return (
    <div>
      <SectionHeading eyebrow="Collaboration" title="Partnership formats" description={ratesNotice} />
      {packages.length ? (
        <ul data-reveal="group" className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {packages.map((p) => (
            <li key={p.id} className="print-avoid glass-card flex flex-col rounded-card p-6 sm:p-7">
              <h3 className="text-lg font-semibold tracking-tight text-fg">{p.name}</h3>
              {p.summary ? <p className="mt-2 text-sm text-muted">{p.summary}</p> : null}
              {p.deliverables.length ? (
                <ul className="mt-5 space-y-2 border-t border-(--glass-line) pt-5 text-sm text-muted">
                  {p.deliverables.map((d) => (
                    <li key={d} className="flex gap-2.5"><Check aria-hidden className="mt-0.5 size-4 shrink-0 text-accent-2" />{d}</li>
                  ))}
                </ul>
              ) : null}
              {p.platforms.length ? (
                <ul className="mt-4 flex flex-wrap gap-1.5">{p.platforms.map((pl) => <li key={pl}><Badge>{PLATFORM_LABELS[pl]}</Badge></li>)}</ul>
              ) : null}
              {p.exclusivityNotes ? <p className="mt-4 text-xs text-subtle">{p.exclusivityNotes}</p> : null}
            </li>
          ))}
        </ul>
      ) : (
        <ul data-reveal="group" className="grid gap-4 sm:grid-cols-2">
          {formats.map((f) => (
            <li key={f.title} className="print-avoid glass-card rounded-card p-6 sm:p-7">
              <h3 className="font-semibold text-fg">{f.title}</h3>
              <p className="mt-2 text-sm text-muted">{f.body}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function WhyPartnerBlock({ items }: { items: { title: string; body: string }[] }) {
  if (!items.length) return null;
  return (
    <div>
      <SectionHeading eyebrow="Why us" title="Why partner with us" />
      <ul data-reveal="group" className="grid gap-4 sm:grid-cols-3">
        {items.map((w) => (
          <li key={w.title} className="print-avoid glass-card rounded-card p-6 sm:p-7">
            <h3 className="font-semibold text-fg">{w.title}</h3>
            <p className="mt-2 text-sm text-muted">{w.body}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function CreativeProcessBlock({ steps }: { steps: { title: string; body: string }[] }) {
  if (!steps.length) return null;
  return (
    <div>
      <SectionHeading eyebrow="How it works" title="Our creative process" />
      <ol data-reveal="group" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, i) => (
          <li key={step.title} className="print-avoid glass-card rounded-card p-6">
            <span className="grid size-8 place-items-center rounded-full bg-fg text-sm font-semibold text-bg tabular-nums">{i + 1}</span>
            <h3 className="mt-4 font-semibold text-fg">{step.title}</h3>
            <p className="mt-2 text-sm text-muted">{step.body}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function UpcomingTopicsBlock({ topics }: { topics: { title: string; month: string }[] }) {
  if (!topics.length) return null;
  return (
    <div className="print-avoid">
      <SectionHeading eyebrow="Coming up" title="Content calendar" />
      <ul className="glass-card divide-y divide-(--glass-line) overflow-hidden rounded-card">
        {topics.map((t) => (
          <li key={t.title} className="flex items-center justify-between gap-4 px-5 py-3.5 text-sm">
            <span className="font-medium text-fg">{t.title}</span>
            <span className="shrink-0 text-muted">{t.month}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SponsorTestimonialsBlock({ items }: { items: SponsorTestimonialDTO[] }) {
  if (!items.length) return null;
  return (
    <div className="print-avoid">
      <SectionHeading eyebrow="From brands" title="What sponsors say" />
      <ul data-reveal="group" className="grid gap-4 sm:grid-cols-2">
        {items.map((t) => (
          <li key={t.id} className="glass-card rounded-card p-6">
            <Stars rating={t.rating} />
            <blockquote className="mt-3 text-fg">&ldquo;{t.quote}&rdquo;</blockquote>
            <p className="mt-3 text-sm text-muted">{[t.authorName, [t.authorTitle, t.company].filter(Boolean).join(", ")].filter(Boolean).join(" — ")}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
