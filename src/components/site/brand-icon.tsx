import { CalendarDays, Globe, Link2, Mail, Newspaper, ShoppingBag, type LucideIcon } from "lucide-react";
import { siFacebook, siGithub, siInstagram, siTiktok, siWhatsapp, siX, siYoutube } from "simple-icons";

import { cn } from "@/lib/utils";

/** Brand marks from Simple Icons (CC0), drawn monochrome in currentColor to match the UI. */
const BRANDS: Record<string, { path: string; title: string }> = {
  youtube: siYoutube,
  tiktok: siTiktok,
  instagram: siInstagram,
  x: siX,
  twitter: siX,
  github: siGithub,
  facebook: siFacebook,
  whatsapp: siWhatsapp,
};

const GENERIC: Record<string, LucideIcon> = {
  website: Globe,
  email: Mail,
  newsletter: Newspaper,
  shop: ShoppingBag,
  calendar: CalendarDays,
};

/** Icon for a link/platform key (e.g. "youtube", "website"); falls back to a neutral link icon. */
export function BrandIcon({ name, className }: { name: string; className?: string }) {
  const key = name.toLowerCase();
  const brand = BRANDS[key];
  if (brand) {
    return (
      <svg aria-hidden viewBox="0 0 24 24" className={cn("size-4 fill-current", className)}>
        <path d={brand.path} />
      </svg>
    );
  }
  if (key === "linkedin") {
    // Simple Icons no longer ships the LinkedIn mark; a typographic "in" keeps the row consistent.
    return (
      <span aria-hidden className={cn("grid size-4 place-items-center rounded-[0.2rem] bg-current", className)}>
        <span className="text-[0.6em] leading-none font-bold text-bg">in</span>
      </span>
    );
  }
  const Icon = GENERIC[key] ?? Link2;
  return <Icon aria-hidden className={cn("size-4", className)} strokeWidth={1.8} />;
}
