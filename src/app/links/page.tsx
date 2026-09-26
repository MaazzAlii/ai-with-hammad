import { ArrowUpRight, ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { BrandIcon } from "@/components/site/brand-icon";
import { LogoMark } from "@/components/site/logo";
import { MediaImage } from "@/components/site/media-image";
import { RevealObserver } from "@/components/site/reveal-observer";
import { initials } from "@/components/site/team-card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { buildMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";
import { getLinkPage, type BioLinkDTO } from "@/server/dal/public/links";
import { getPublicSettings, getSiteMedia } from "@/server/dal/public/site";

/** Rendered per request: the page is tiny, and links must appear the moment they are saved. */
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { general } = await getPublicSettings();
  return buildMetadata({ title: `${general.siteName} — links`, description: general.tagline || general.description, path: "/links" });
}

const KIND_LABEL: Partial<Record<BioLinkDTO["kind"], string>> = { affiliate: "Affiliate", sponsor: "Sponsored" };

/** Every link goes through /go/<id> so clicks are counted; mailto links open directly. */
function href(l: BioLinkDTO) {
  return l.url.startsWith("mailto:") ? l.url : `/go/${l.id}`;
}

function LinkRow({ link, featured = false }: { link: BioLinkDTO; featured?: boolean }) {
  const external = !link.url.startsWith("mailto:");
  return (
    <a
      href={href(link)}
      {...(external ? { target: "_blank", rel: link.kind === "link" ? "noopener" : "noopener sponsored" } : {})}
      className={cn(
        "group lift flex items-center gap-3.5 rounded-[1.25rem] p-3 pr-4",
        featured ? "glass-panel min-h-18 p-4" : "glass-card min-h-15",
      )}
    >
      <span className={cn("grid shrink-0 place-items-center rounded-[0.85rem]", featured ? "size-11 bg-accent text-accent-fg" : "size-10 bg-fg/[0.05] text-fg")}>
        <BrandIcon name={link.icon} className={featured ? "size-5" : "size-[1.15rem]"} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className={cn("truncate font-medium text-fg", featured && "text-[1.0625rem] font-semibold")}>{link.title}</span>
          {KIND_LABEL[link.kind] ? <Badge className="shrink-0">{KIND_LABEL[link.kind]}</Badge> : null}
        </span>
        {link.description ? <span className="mt-0.5 line-clamp-2 block text-sm text-muted">{link.description}</span> : null}
      </span>
      <ArrowUpRight aria-hidden className="size-4 shrink-0 text-subtle transition-transform duration-(--duration-base) ease-spring group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
    </a>
  );
}

function SocialRow({ items, label }: { items: { key: string; href: string; name: string }[]; label: string }) {
  if (!items.length) return null;
  return (
    <ul aria-label={label} className="flex flex-wrap justify-center gap-2">
      {items.map((s) => (
        <li key={s.href}>
          <a href={s.href} target="_blank" rel="noopener me" aria-label={s.name} className="glass-card pressable grid size-11 place-items-center rounded-full text-fg hover:scale-105">
            <BrandIcon name={s.key} className="size-[1.15rem]" />
          </a>
        </li>
      ))}
    </ul>
  );
}

export default async function LinksPage() {
  const [{ general }, media, data] = await Promise.all([getPublicSettings(), getSiteMedia(), getLinkPage()]);
  const empty = !data.featured.length && !data.links.length && !data.partners.length && !data.socials.length && !data.people.length;
  return (
    <main className="page-enter mx-auto flex min-h-dvh w-full max-w-lg flex-col px-4 pt-[max(2.5rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))]">
      <ThemeToggle className="glass-card fixed top-[max(1rem,env(safe-area-inset-top))] right-4 z-10" />
      <header className="flex flex-col items-center text-center">
        <LogoMark name={general.siteName} logo={media.logo} className="size-20 rounded-[1.4rem] text-3xl shadow-panel" />
        <h1 className="mt-5 text-[1.75rem]">{general.siteName}</h1>
        <p className="mt-2 max-w-sm text-[0.9375rem] leading-relaxed text-muted">Every channel, video and tool we recommend — in one place.</p>
        <div className="mt-5">
          <SocialRow label="Social profiles" items={data.socials.map((s) => ({ key: s.icon || s.title, href: href(s), name: s.title }))} />
        </div>
      </header>

      {data.featured.length ? (
        <section aria-label="Featured" data-reveal="group" className="mt-8 space-y-3">
          {data.featured.map((l) => (
            <LinkRow key={l.id} link={l} featured />
          ))}
        </section>
      ) : null}

      {data.links.length ? (
        <section aria-label="Links" data-reveal="group" className="mt-3 space-y-3">
          {data.links.map((l) => (
            <LinkRow key={l.id} link={l} />
          ))}
        </section>
      ) : null}

      {data.people.map(({ member, profiles, links }) => (
        <section key={member.id} aria-labelledby={`p-${member.id}`} data-reveal="item" className="glass-card mt-8 rounded-[1.75rem] p-4">
          <div className="flex items-center gap-3 px-1">
            {member.photo ? (
              <MediaImage media={member.photo} alt="" ratio="1/1" rounded={false} className="size-12 shrink-0 rounded-full" sizes="48px" />
            ) : (
              <span aria-hidden className="grid size-12 shrink-0 place-items-center rounded-full bg-accent-soft font-semibold text-accent">
                {initials(member.name)}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <h2 id={`p-${member.id}`} className="truncate text-base">
                <Link href={`/team/${member.slug}`} className="hover:underline">
                  {member.name}
                </Link>
              </h2>
              {member.roleTitle ? <p className="truncate text-sm text-muted">{member.roleTitle}</p> : null}
            </div>
          </div>
          {profiles.length ? (
            <div className="mt-4">
              <SocialRow label={`${member.name} on social media`} items={profiles.map((s) => ({ key: s.icon || s.title, href: href(s), name: `${member.name} on ${s.title}` }))} />
            </div>
          ) : null}
          {links.length ? (
            <div className="mt-4 space-y-2.5">
              {links.map((l) => (
                <LinkRow key={l.id} link={l} />
              ))}
            </div>
          ) : null}
        </section>
      ))}

      {data.partners.length ? (
        <section aria-labelledby="partners" data-reveal="group" className="mt-8 space-y-3">
          <div className="px-1">
            <h2 id="partners" className="label-caps">Partners &amp; tools we use</h2>
            <p className="mt-1 text-xs text-subtle">Some of these are affiliate or sponsored links — we may earn a commission, at no extra cost to you.</p>
          </div>
          {data.partners.map((l) => (
            <LinkRow key={l.id} link={l} />
          ))}
        </section>
      ) : null}

      {empty ? <p className="mt-10 text-center text-sm text-muted">Links will appear here soon.</p> : null}

      <footer className="mt-auto pt-12 text-center">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:justify-center">
          <Link href="/" className={buttonVariants({ variant: "secondary" })}>
            Visit the website
          </Link>
          <Link href="/contact" className={buttonVariants({ className: "group/btn" })}>
            Work with us <ChevronRight aria-hidden className="transition-transform duration-(--duration-base) ease-spring group-hover/btn:translate-x-0.5" />
          </Link>
        </div>
        <p className="mt-6 text-xs text-subtle">© {new Date().getUTCFullYear()} {general.siteName}</p>
      </footer>
      <RevealObserver />
    </main>
  );
}
