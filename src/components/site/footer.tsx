import { ArrowUpRight, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import Link from "next/link";

import type { MediaDTO } from "@/server/dal/public/media";
import type { NavLink } from "@/server/dal/public/site";

import { Logo } from "./logo";

const linkClass = "text-muted transition-colors duration-(--duration-fast) hover:text-fg";

export function SiteFooter({
  siteName,
  tagline,
  logo,
  links,
  legal,
  social,
  email,
  phone = "",
  whatsapp = null,
  location = "",
}: {
  siteName: string;
  tagline: string;
  logo: MediaDTO | null;
  links: NavLink[];
  legal: NavLink[];
  social: { platform: string; url: string }[];
  email: string;
  phone?: string;
  whatsapp?: string | null;
  location?: string;
}) {
  const year = new Date().getUTCFullYear();
  return (
    <footer className="no-print pb-safe">
      <div className="container-page">
        <hr className="hairline" />
        <div className="grid gap-12 py-14 lg:grid-cols-[1fr_1.6fr_auto] lg:gap-16 lg:py-20">
          <div>
            <Logo name={siteName} logo={logo} />
            {tagline ? <p className="mt-4 max-w-xs text-[0.9375rem] leading-relaxed text-muted">{tagline}</p> : null}
            <ul className="mt-6 space-y-2.5 text-sm">
              {email ? (
                <li>
                  <a href={`mailto:${email}`} className={`inline-flex items-center gap-2 ${linkClass}`}>
                    <Mail aria-hidden className="size-4 text-subtle" strokeWidth={1.75} /> {email}
                  </a>
                </li>
              ) : null}
              {phone ? (
                <li>
                  <a href={`tel:${phone.replace(/[^+\d]/g, "")}`} className={`inline-flex items-center gap-2 ${linkClass}`}>
                    <Phone aria-hidden className="size-4 text-subtle" strokeWidth={1.75} /> {phone}
                  </a>
                </li>
              ) : null}
              {whatsapp ? (
                <li>
                  <a href={whatsapp} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-2 ${linkClass}`}>
                    <MessageCircle aria-hidden className="size-4 text-subtle" strokeWidth={1.75} /> WhatsApp
                  </a>
                </li>
              ) : null}
              {location ? (
                <li className="inline-flex items-center gap-2 text-subtle">
                  <MapPin aria-hidden className="size-4" strokeWidth={1.75} /> {location}
                </li>
              ) : null}
            </ul>
          </div>
          <nav aria-label="Footer">
            <h2 className="label-caps mb-4">Explore</h2>
            <ul className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm sm:grid-cols-3">
              {links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className={linkClass} {...(l.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                    {l.label}
                  </Link>
                </li>
              ))}
              {links.some((l) => l.href === "/links") ? null : (
              <li>
                <Link href="/links" className={linkClass}>
                  All links
                </Link>
              </li>
              )}
              <li>
                <Link href="/portal/login" className={linkClass}>
                  Client portal
                </Link>
              </li>
            </ul>
          </nav>
          {social.length ? (
            <div>
              <h2 className="label-caps mb-4">Follow</h2>
              <ul className="space-y-2.5 text-sm">
                {social.map((s) => (
                  <li key={s.url}>
                    <a href={s.url} target="_blank" rel="noopener noreferrer me" className={`group inline-flex items-center gap-1 capitalize ${linkClass}`}>
                      {s.platform}
                      <ArrowUpRight aria-hidden className="size-3.5 opacity-0 transition-[opacity,translate] duration-(--duration-base) ease-spring group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
        <div className="flex flex-col gap-3 border-t border-(--glass-line) py-6 text-xs text-subtle sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {siteName}
          </p>
          <nav aria-label="Legal">
            <ul className="flex flex-wrap gap-x-5 gap-y-2">
              {legal.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="transition-colors hover:text-fg">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}
