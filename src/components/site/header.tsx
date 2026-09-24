import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import type { NavLink } from "@/server/dal/public/site";
import type { MediaDTO } from "@/server/dal/public/media";

import { Logo } from "./logo";
import { MobileNav } from "./mobile-nav";
import { NavLinks } from "./nav-links";

export function SiteHeader({ siteName, logo, links }: { siteName: string; logo: MediaDTO | null; links: NavLink[] }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-bg/80 backdrop-blur-xl supports-[backdrop-filter]:bg-bg/65">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/" className="rounded-control" aria-label={`${siteName} — home`}>
          <Logo name={siteName} logo={logo} />
        </Link>
        <nav aria-label="Main" className="hidden lg:block">
          <NavLinks links={links} />
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/contact" className={buttonVariants({ size: "sm", className: "hidden sm:inline-flex" })}>
            Start a project
          </Link>
          <MobileNav links={links} />
        </div>
      </div>
    </header>
  );
}
