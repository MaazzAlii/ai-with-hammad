import {
  BarChart3,
  Bot,
  Brain,
  Code2,
  Database,
  Layers,
  MessageSquare,
  Plug,
  Rocket,
  Search,
  ShieldCheck,
  Sparkles,
  Workflow,
  Zap,
  type LucideIcon,
} from "lucide-react";

/** Fixed icon allow-list selectable in the Service CMS. */
export const SERVICE_ICONS: Record<string, LucideIcon> = {
  sparkles: Sparkles,
  workflow: Workflow,
  plug: Plug,
  bot: Bot,
  brain: Brain,
  database: Database,
  code: Code2,
  search: Search,
  chart: BarChart3,
  shield: ShieldCheck,
  zap: Zap,
  chat: MessageSquare,
  layers: Layers,
  rocket: Rocket,
};

export const SERVICE_ICON_NAMES = Object.keys(SERVICE_ICONS);

export function ServiceIcon({ name, className }: { name: string; className?: string }) {
  const Icon = SERVICE_ICONS[name] ?? Sparkles;
  return <Icon aria-hidden className={className} />;
}
