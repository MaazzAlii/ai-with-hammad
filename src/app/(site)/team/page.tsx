import { Users } from "lucide-react";
import type { Metadata } from "next";

import { JsonLd } from "@/components/site/json-ld";
import { EmptyState, PageHeader, Section } from "@/components/site/section";
import { TeamCard } from "@/components/site/team-card";
import { breadcrumbLd } from "@/lib/jsonld";
import { buildMetadata } from "@/lib/seo";
import { getPublicSettings } from "@/server/dal/public/site";
import { listPublishedTeam } from "@/server/dal/public/team";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const { general } = await getPublicSettings();
  return buildMetadata({ title: "Team", description: `The engineers, designers and creators behind ${general.siteName}.`, path: "/team" });
}

export default async function TeamPage() {
  const team = await listPublishedTeam();
  return (
    <>
      <PageHeader eyebrow="People" title="The team" description="The people who design, build and operate our systems — and make our content." />
      <Section>
        {team.length ? (
          <ul data-reveal="group" className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {team.map((m) => (
              <li key={m.id}>
                <TeamCard member={m} />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="Team profiles coming soon" icon={<Users />} />
        )}
      </Section>
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Team", path: "/team" }])} />
    </>
  );
}
