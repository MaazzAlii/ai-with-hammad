import { Users } from "lucide-react";
import type { Metadata } from "next";

import { JsonLd } from "@/components/site/json-ld";
import { MediaImage } from "@/components/site/media-image";
import { EmptyState, PageHeader, Section, SectionHeading } from "@/components/site/section";
import { TeamCard } from "@/components/site/team-card";
import { breadcrumbLd } from "@/lib/jsonld";
import { buildMetadata } from "@/lib/seo";
import { getPublicSettings } from "@/server/dal/public/site";
import { getTeamCulturePhotos, listPublishedTeam } from "@/server/dal/public/team";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const { general } = await getPublicSettings();
  return buildMetadata({ title: "Team", description: `The engineers, designers and creators behind ${general.siteName}.`, path: "/team" });
}

export default async function TeamPage() {
  const [settings, allMembers] = await Promise.all([getPublicSettings(), listPublishedTeam()]);
  const team = allMembers.filter((m) => m.memberType === "team");
  const advisors = allMembers.filter((m) => m.memberType === "advisor");
  const culturePhotos = await getTeamCulturePhotos(settings.team.cultureMediaIds);
  return (
    <>
      <PageHeader eyebrow="People" title="The team" description="The people who design, build and operate our systems — and make our content." />
      <Section>
        {team.length ? (
          <ul data-reveal="group" className="focus-group grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {team.map((m, i) => (
              <li key={m.id}>
                <TeamCard member={m} priority={i === 0} />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="Team profiles coming soon" icon={<Users />} />
        )}
      </Section>

      {advisors.length ? (
        <Section aria-labelledby="advisors-title" className="cv-auto">
          <SectionHeading id="advisors-title" eyebrow="Advisors" title="Advisors & mentors" />
          <ul data-reveal="group" className="focus-group grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {advisors.map((m) => (
              <li key={m.id}>
                <TeamCard member={m} />
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {settings.about.values.length ? (
        <Section aria-labelledby="values-title" className="cv-auto">
          <SectionHeading id="values-title" eyebrow="Values" title="What we hold ourselves to" />
          <ul data-reveal="group" className="focus-group grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {settings.about.values.map((v) => (
              <li key={v.title} className="glass-card rounded-card p-6">
                <h3 className="font-semibold text-fg">{v.title}</h3>
                {v.body ? <p className="mt-2 text-sm leading-relaxed text-muted">{v.body}</p> : null}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {settings.team.philosophyBody ? (
        <Section aria-labelledby="philosophy-title" className="cv-auto">
          <div data-reveal="item" className="glass-panel mx-auto max-w-2xl rounded-[2rem] p-8 text-center sm:p-12">
            <p className="eyebrow mb-3">{settings.team.philosophyTitle || "How we think"}</p>
            <p className="text-lg leading-relaxed text-fg sm:text-xl">{settings.team.philosophyBody}</p>
          </div>
        </Section>
      ) : null}

      {culturePhotos.length ? (
        <Section aria-labelledby="culture-title" className="cv-auto">
          <SectionHeading id="culture-title" eyebrow="Culture" title="Life at the studio" />
          <ul data-reveal="group" className="focus-group grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {culturePhotos.map((p) => (
              <li key={p.url}>
                <MediaImage media={p} ratio="1/1" />
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {settings.team.openRoles.length ? (
        <Section aria-labelledby="roles-title" className="cv-auto">
          <SectionHeading id="roles-title" eyebrow="Careers" title="Open roles" />
          <ul data-reveal="group" className="focus-group grid gap-4 sm:grid-cols-2">
            {settings.team.openRoles.map((r) => (
              <li key={r.title} className="glass-card rounded-card p-6">
                <h3 className="font-semibold text-fg">{r.title}</h3>
                {r.body ? <p className="mt-2 text-sm leading-relaxed text-muted">{r.body}</p> : null}
                {r.applyUrl ? (
                  <a href={r.applyUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block text-sm font-medium text-accent hover:underline">
                    Apply
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Team", path: "/team" }])} />
    </>
  );
}
