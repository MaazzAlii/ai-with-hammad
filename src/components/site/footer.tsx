import Link from "next/link";

import type { MediaDTO } from "@/server/dal/public/media";
import type { NavLink } from "@/server/dal/public/site";

import { Logo } from "./logo";

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
    <footer className="border-t border-border bg-surface/40">
      <div className="container-page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <Logo name={siteName} logo={logo} />
          <p className="mt-3 max-w-sm text-sm text-muted">{tagline}</p>
          <ul className="mt-4 space-y-1.5 text-sm">
            {email ? (
              <li>
                <a href={`mailto:${email}`} className="text-accent hover:underline">{email}</a>
              </li>
            ) : null}
            {phone ? (
              <li>
                <a href={`tel:${phone.replace(/[^+\d]/g, "")}`} className="text-muted hover:text-fg">{phone}</a>
              </li>
            ) : null}
            {whatsapp ? (
              <li>
                <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="text-success hover:underline">WhatsApp</a>
              </li>
            ) : null}
            {location ? <li className="text-subtle">{location}</li> : null}
          </ul>
        </div>
        <nav aria-label="Footer">
          <h2 className="eyebrow mb-3">Explore</h2>
          <ul className="space-y-2 text-sm">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-muted hover:text-fg" {...(l.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        {social.length ? (
          <div>
            <h2 className="eyebrow mb-3">Follow</h2>
            <ul className="space-y-2 text-sm">
              {social.map((s) => (
                <li key={s.url}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer me" className="text-muted capitalize hover:text-fg">
                    {s.platform}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
      <div className="border-t border-border">
        <div className="container-page flex flex-col gap-3 py-6 text-xs text-subtle sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {siteName}
          </p>
          <Link href="/portal/login" className="hover:text-fg">Client portal</Link>
          <nav aria-label="Legal">
            <ul className="flex flex-wrap gap-x-5 gap-y-2">
              {legal.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-fg">
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
