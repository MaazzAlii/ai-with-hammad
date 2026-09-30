import { ArrowUpRight, Clock, Globe, Mail, MapPin, Mic } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BrandIcon } from "@/components/site/brand-icon";
import { JsonLd } from "@/components/site/json-ld";
import { Markdown } from "@/components/site/markdown";
import { MediaImage, MediaPlaceholder } from "@/components/site/media-image";
import { ProjectCard } from "@/components/site/project-card";
import { Breadcrumb, Section, SectionHeading } from "@/components/site/section";
import { initials } from "@/components/site/team-card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Tilt } from "@/components/ui/tilt";
import { breadcrumbLd, personLd } from "@/lib/jsonld";
import { buildMetadata } from "@/lib/seo";
import { listLiveBioLinks } from "@/server/dal/public/links";
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
  const [projects, bioLinks] = await Promise.all([listProjectsForTeamMember(member.id), listLiveBioLinks()]);
  // Socials from the team profile plus "Social profile" links assigned to this person in
  // Admin → Link in bio — one list, no duplicates.
  const socials = [
    ...member.links.map((l) => ({ key: l.platform, label: l.label || l.platform, url: l.url })),
    ...bioLinks.filter((l) => l.teamMemberId === member.id && l.kind === "social").map((l) => ({ key: l.icon || l.title, label: l.title, url: l.url })),
  ].filter((s, i, all) => all.findIndex((o) => o.url.replace(/\/$/, "") === s.url.replace(/\/$/, "")) === i);
  const sameAs = [...socials.map((s) => s.url).filter((u) => u.startsWith("https://")), ...(member.websiteUrl ? [member.websiteUrl] : [])];
  return (
    <>
      <div className="container-page pt-12 pb-14 sm:pt-20 sm:pb-20">
        <Breadcrumb href="/team" label="Team" current={member.name} />
        <div className="grid gap-10 md:grid-cols-[18rem_1fr] lg:gap-16">
          <div className="max-md:max-w-[15rem]">
            {member.photo ? (
              <Tilt className="rounded-media" max={4}>
                <MediaImage media={member.photo} alt={member.photo.alt || `Portrait of ${member.name}`} ratio="3/4" priority sizes="(min-width: 768px) 18rem, 15rem" className="shadow-panel" />
              </Tilt>
            ) : (
              <>
                {/* No photo yet: a compact monogram on phones instead of a screen-tall empty frame. */}
                <span aria-hidden className="grid size-24 place-items-center rounded-full bg-accent-soft text-3xl font-semibold text-accent md:hidden">
                  {initials(member.name)}
                </span>
                <MediaPlaceholder label={initials(member.name)} ratio="3/4" className="hidden md:grid" />
              </>
            )}
          </div>
          <div>
            <h1 className="text-[2.5rem] sm:text-6xl">{member.name}</h1>
            {member.roleTitle ? <p className="mt-3 text-xl text-muted">{member.roleTitle}</p> : null}
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
              {member.location ? <span className="inline-flex items-center gap-1.5"><MapPin aria-hidden className="size-4" /> {member.location}</span> : null}
              {member.timezone ? <span className="inline-flex items-center gap-1.5"><Clock aria-hidden className="size-4" /> {member.timezone}</span> : null}
              {member.websiteUrl ? (
                <a href={member.websiteUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 transition-colors hover:text-fg"><Globe aria-hidden className="size-4" /> Website</a>
              ) : null}
            </div>
            {member.email ? (
              <a href={`mailto:${member.email}`} className={buttonVariants({ variant: "secondary", size: "sm", className: "mt-5" })}>
                <Mail aria-hidden /> Contact {member.name.split(" ")[0]}
              </a>
            ) : null}
            {member.bio ? <p className="mt-7 max-w-2xl text-lg leading-relaxed text-fg">{member.bio}</p> : null}
            {member.philosophy ? (
              <blockquote className="glass-card mt-6 max-w-2xl rounded-card border-l-2 border-accent p-5 text-fg italic">&ldquo;{member.philosophy}&rdquo;</blockquote>
            ) : null}
            {member.longBio ? <Markdown source={member.longBio} className="mt-6" /> : null}
            {member.funFact ? (
              <p className="mt-6 max-w-2xl text-sm text-muted"><span className="font-medium text-fg">Fun fact:</span> {member.funFact}</p>
            ) : null}
            {member.skills.length ? (
              <div className="mt-10">
                <h2 className="label-caps mb-3">Skills</h2>
                <ul className="flex flex-wrap gap-1.5">{member.skills.map((s) => <li key={s}><Badge>{s}</Badge></li>)}</ul>
              </div>
            ) : null}
            {member.certifications.length ? (
              <div className="mt-6">
                <h2 className="label-caps mb-3">Certifications</h2>
                <ul className="flex flex-wrap gap-1.5">{member.certifications.map((c) => <li key={c}><Badge>{c}</Badge></li>)}</ul>
              </div>
            ) : null}
            {member.languages.length ? (
              <div className="mt-6">
                <h2 className="label-caps mb-3">Languages</h2>
                <p className="text-sm text-muted">{member.languages.join(", ")}</p>
              </div>
            ) : null}
            {socials.length ? (
              <div className="mt-10">
                <h2 className="label-caps mb-3">Find {member.name.split(" ")[0]} online</h2>
                <ul className="flex flex-wrap gap-2">
                  {socials.map((s) => (
                    <li key={s.url}>
                      <a
                        href={s.url}
                        {...(s.url.startsWith("mailto:") ? {} : { target: "_blank", rel: "noopener noreferrer me" })}
                        className={buttonVariants({ variant: "secondary", size: "sm", className: "group/s capitalize" })}
                      >
                        <BrandIcon name={s.key} />
                        {s.label}
                        <ArrowUpRight aria-hidden className="opacity-50 transition-[opacity,translate] duration-(--duration-base) ease-spring group-hover/s:translate-x-0.5 group-hover/s:-translate-y-0.5 group-hover/s:opacity-100" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {member.appearances.length ? (
              <div className="mt-10">
                <h2 className="label-caps mb-3">Speaking & appearances</h2>
                <ul className="space-y-3">
                  {member.appearances.map((a, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm">
                      <Mic aria-hidden className="mt-0.5 size-4 shrink-0 text-subtle" />
                      <span>
                        {a.url ? (
                          <a href={a.url} target="_blank" rel="noopener noreferrer" className="font-medium text-fg underline decoration-1 underline-offset-2 hover:text-accent">{a.title}</a>
                        ) : (
                          <span className="font-medium text-fg">{a.title}</span>
                        )}
                        {a.venue || a.appearedOn ? <span className="text-muted"> — {[a.venue, a.appearedOn].filter(Boolean).join(", ")}</span> : null}
                      </span>
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
          <ul data-reveal="group" className="focus-group grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
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
