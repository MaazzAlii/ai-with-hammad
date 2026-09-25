import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import type { MediaDTO } from "@/server/dal/public/media";
import type { NavLink } from "@/server/dal/public/site";

import { HeaderShell } from "./header-shell";
import { Logo } from "./logo";
import { MobileMenu } from "./mobile-menu";
import { NavLinks } from "./nav-links";

/**
 * Floating glass navigation bar. Desktop: segmented nav + CTA in one capsule.
 * Phones/tablets: logo, compact CTA and a menu button that drops a panel down from the top.
 */
export function SiteHeader({ siteName, logo, links }: { siteName: string; logo: MediaDTO | null; links: NavLink[] }) {
  return (
    <HeaderShell>
      <Link href="/" className="pressable min-w-0 rounded-full py-1 pr-2 pl-1.5" aria-label={`${siteName} — home`}>
        <Logo name={siteName} logo={logo} />
      </Link>
      <nav aria-label="Main" className="hidden lg:block">
        <NavLinks links={links} />
      </nav>
      <div className="flex shrink-0 items-center gap-1">
        <Link href="/contact" className={buttonVariants({ size: "sm", className: "group/cta hidden sm:inline-flex" })}>
          Start a project
          <ArrowRight aria-hidden className="transition-transform duration-(--duration-base) ease-spring group-hover/cta:translate-x-0.5" />
        </Link>
        <MobileMenu links={links} />
      </div>
    </HeaderShell>
  );
}
