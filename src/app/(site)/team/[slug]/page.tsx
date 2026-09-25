import { ArrowUpRight, Globe, MapPin } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/site/json-ld";
import { Markdown } from "@/components/site/markdown";
import { MediaImage, MediaPlaceholder } from "@/components/site/media-image";
import { ProjectCard } from "@/components/site/project-card";
import { Breadcrumb, Section, SectionHeading } from "@/components/site/section";
import { initials } from "@/components/site/team-card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { breadcrumbLd, personLd } from "@/lib/jsonld";
import { buildMetadata } from "@/lib/seo";
import { listProjectsForTeamMember } from "@/server/dal/public/projects";
import { getPublishedTeamMember, listPublishedTeam } from "@/server/dal/public/team";

export const revalidate = 3600;

export async function generateStaticParams() {
  return (await listPublishedTeam()).map((m) => ({ slug: m.slug }));
}

export async function generateMetadata(props: PageProps<"/team/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const m = await getPublishedTeamMember(slug);
  if (!m) return {};
  return buildMetadata({
    title: `${m.name}${m.roleTitle ? ` — ${m.roleTitle}` : ""}`,
    description: m.bio || `${m.name}, ${m.roleTitle}`,
    path: `/team/${m.slug}`,
    image: m.photo,
    type: "profile",
  });
}

export default async function TeamMemberPage(props: PageProps<"/team/[slug]">) {
  const { slug } = await props.params;
  const member = await getPublishedTeamMember(slug);
  if (!member) notFound();
  const projects = await listProjectsForTeamMember(member.id);
  const sameAs = [...member.links.map((l) => l.url), ...(member.websiteUrl ? [member.websiteUrl] : [])];
  return (
    <>
      <div className="container-page pt-12 pb-14 sm:pt-20 sm:pb-20">
        <Breadcrumb href="/team" label="Team" current={member.name} />
        <div className="grid gap-10 md:grid-cols-[18rem_1fr] lg:gap-16">
          <div>
            {member.photo ? (
              <MediaImage media={member.photo} alt={member.photo.alt || `Portrait of ${member.name}`} ratio="3/4" priority sizes="(min-width: 768px) 18rem, 100vw" className="shadow-panel" />
            ) : (
              <MediaPlaceholder label={initials(member.name)} ratio="3/4" />
            )}
          </div>
          <div>
            <h1 className="text-[2.5rem] sm:text-6xl">{member.name}</h1>
            {member.roleTitle ? <p className="mt-3 text-xl text-muted">{member.roleTitle}</p> : null}
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
              {member.location ? <span className="inline-flex items-center gap-1.5"><MapPin aria-hidden className="size-4" /> {member.location}</span> : null}
              {member.websiteUrl ? (
                <a href={member.websiteUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 transition-colors hover:text-fg"><Globe aria-hidden className="size-4" /> Website</a>
              ) : null}
            </div>
            {member.bio ? <p className="mt-7 max-w-2xl text-lg leading-relaxed text-fg">{member.bio}</p> : null}
            {member.longBio ? <Markdown source={member.longBio} className="mt-6" /> : null}
            {member.skills.length ? (
              <div className="mt-10">
                <h2 className="label-caps mb-3">Skills</h2>
                <ul className="flex flex-wrap gap-1.5">{member.skills.map((s) => <li key={s}><Badge>{s}</Badge></li>)}</ul>
              </div>
            ) : null}
            {member.links.length ? (
              <div className="mt-10">
                <h2 className="label-caps mb-3">Elsewhere</h2>
                <ul className="flex flex-wrap gap-2">
                  {member.links.map((l) => (
                    <li key={l.url}>
                      <a href={l.url} target="_blank" rel="noopener noreferrer me" className={buttonVariants({ variant: "secondary", size: "sm", className: "capitalize" })}>
                        {l.label || l.platform} <ArrowUpRight aria-hidden />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>
      </div>
      {projects.length ? (
        <Section aria-labelledby="member-projects">
          <SectionHeading id="member-projects" eyebrow="Work" title={`Projects with ${member.name.split(" ")[0]}`} />
          <ul data-reveal="group" className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => <li key={p.id}><ProjectCard project={p} /></li>)}
          </ul>
        </Section>
      ) : null}
      <JsonLd
        data={[
          personLd({ name: member.name, jobTitle: member.roleTitle, description: member.bio, path: `/team/${member.slug}`, imageUrl: member.photo?.url, sameAs }),
          breadcrumbLd([{ name: "Home", path: "/" }, { name: "Team", path: "/team" }, { name: member.name, path: `/team/${member.slug}` }]),
        ]}
      />
    </>
  );
}
