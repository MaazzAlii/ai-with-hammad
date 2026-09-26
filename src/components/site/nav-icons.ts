import {
  BriefcaseBusiness,
  Compass,
  FolderKanban,
  Handshake,
  Home,
  Info,
  Link2,
  Mail,
  MessageSquareQuote,
  PlaySquare,
  Users,
  type LucideIcon,
} from "lucide-react";

/** Navigation links are CMS-managed, so icons are matched by path prefix with a neutral fallback. */
const ICONS: [prefix: string, icon: LucideIcon][] = [
  ["/projects", FolderKanban],
  ["/services", BriefcaseBusiness],
  ["/content", PlaySquare],
  ["/team", Users],
  ["/about", Info],
  ["/sponsorship", Handshake],
  ["/media-kit", Handshake],
  ["/testimonials", MessageSquareQuote],
  ["/contact", Mail],
  ["/links", Link2],
];

export function navIcon(href: string): LucideIcon {
  if (href === "/") return Home;
  return ICONS.find(([p]) => href === p || href.startsWith(`${p}/`) || href.startsWith(`${p}?`))?.[1] ?? Compass;
}
