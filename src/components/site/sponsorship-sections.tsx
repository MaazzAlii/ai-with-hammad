import { ExternalLink } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatCompactNumber, formatDate } from "@/lib/utils";
import { PLATFORM_LABELS, type ContentCardDTO, type PlatformDTO } from "@/server/dal/public/content";
import type { PackageDTO, PartnerDTO } from "@/server/dal/public/sponsorship";
import type { PublicSettings } from "@/server/dal/public/site";

import { AudienceBars } from "./audience-bars";
import { ContentCard } from "./content-card";
import { MediaImage } from "./media-image";
import { PlatformCards } from "./platform-cards";
import { SectionHeading } from "./section";

/** Shared blocks used by /sponsorship and /media-kit. Every block hides itself when its data is empty. */

export function AudienceBlock({ s, platforms }: { s: PublicSettings["sponsorship"]; platforms: PlatformDTO[] }) {
  const a = s.audience;
  const hasBreakdown = a.ageRanges.length || a.topCountries.length || a.genderSplit.length;
  const totalFollowers = platforms.reduce((n, p) => n + (p.followers ?? 0), 0);
  const withFollowers = platforms.filter((p) => p.followers != null);
  if (!s.audienceSummary && !hasBreakdown && !withFollowers.length) return null;
  return (
    <div className="print-avoid">
      <SectionHeading eyebrow="Audience" title="Who watches" description={s.audienceSummary || undefined} />
      {withFollowers.length ? (
        <p className="mb-6 text-muted">
          <span className="font-mono text-3xl text-accent">{formatCompactNumber(totalFollowers)}</span> combined followers across {withFollowers.length} platform{withFollowers.length === 1 ? "" : "s"}
          <span className="block text-xs text-subtle">Sum of the follower counts listed below, each with its own &quot;as of&quot; date.</span>
        </p>
      ) : null}
      {hasBreakdown ? (
        <div className="grid gap-4 md:grid-cols-3">
          <AudienceBars title="Age" rows={a.ageRanges} />
          <AudienceBars title="Top countries" rows={a.topCountries} />
          <AudienceBars title="Gender" rows={a.genderSplit} />
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
          <li key={c}><Badge variant="accent" className="px-3 py-1 text-sm">{c}</Badge></li>
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
      <ul className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
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
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {partners.map((p) => (
          <li key={p.slug} className="print-avoid flex flex-col rounded-card border border-border bg-surface/60 p-5">
            <div className="flex items-center gap-3">
              {p.logo ? <MediaImage media={p.logo} alt={`${p.name} logo`} ratio="1/1" rounded={false} className="size-10 shrink-0 rounded-control bg-white/5" imgClassName="object-contain p-1" sizes="40px" /> : null}
              <div>
                <h3 className="font-semibold text-fg">{p.name}</h3>
                {p.partneredOn ? <p className="text-xs text-subtle">{formatDate(p.partneredOn, { day: undefined })}</p> : null}
              </div>
            </div>
            {p.campaignSummary || p.description ? <p className="mt-3 flex-1 text-sm text-muted">{p.campaignSummary || p.description}</p> : null}
            {p.websiteUrl ? (
              <a href={p.websiteUrl} target="_blank" rel="noopener noreferrer" className="no-print mt-3 inline-flex items-center gap-1 text-sm text-accent hover:underline">
                Website <ExternalLink aria-hidden className="size-3.5" />
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
        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {packages.map((p) => (
            <li key={p.id} className="print-avoid flex flex-col rounded-card border border-border bg-surface/60 p-6">
              <h3 className="text-lg font-semibold text-fg">{p.name}</h3>
              {p.summary ? <p className="mt-2 text-sm text-muted">{p.summary}</p> : null}
              {p.deliverables.length ? (
                <ul className="mt-4 space-y-1.5 text-sm text-muted">
                  {p.deliverables.map((d) => (
                    <li key={d} className="flex gap-2"><span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-accent-2" />{d}</li>
                  ))}
                </ul>
              ) : null}
              {p.platforms.length ? (
                <ul className="mt-4 flex flex-wrap gap-1.5">{p.platforms.map((pl) => <li key={pl}><Badge>{PLATFORM_LABELS[pl]}</Badge></li>)}</ul>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {formats.map((f) => (
            <li key={f.title} className="print-avoid rounded-card border border-border bg-surface/60 p-6">
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
      <ul className="grid gap-4 sm:grid-cols-3">
        {items.map((w) => (
          <li key={w.title} className="print-avoid rounded-card border border-border bg-surface/60 p-6">
            <h3 className="font-semibold text-fg">{w.title}</h3>
            <p className="mt-2 text-sm text-muted">{w.body}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
