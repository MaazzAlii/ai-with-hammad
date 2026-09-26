import "server-only";

import { publicEnv } from "@/lib/env";
import { listPublishedContent, PLATFORM_LABELS } from "@/server/dal/public/content";
import { listPublishedProjects } from "@/server/dal/public/projects";
import { getServiceFeatureTitles, listPublishedServices } from "@/server/dal/public/services";
import { getPublicSettings } from "@/server/dal/public/site";
import { listPublishedTeam } from "@/server/dal/public/team";
import { listPublishedFaqs } from "@/server/dal/public/testimonials";

/** Marker the model appends when the visitor should get the "share your details" form. */
export const LEAD_MARKER = "[[LEAD_FORM]]";

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

/**
 * System prompt for the site assistant, built from published CMS content only (the honesty
 * rule applies to the assistant too: it must not invent clients, prices, numbers or claims).
 */
export async function buildAssistantPrompt(): Promise<string> {
  const [settings, services, projects, faqs, team, content] = await Promise.all([
    getPublicSettings(),
    listPublishedServices(),
    listPublishedProjects({ limit: 12 }),
    listPublishedFaqs(),
    listPublishedTeam(),
    listPublishedContent(),
  ]);
  const features = await getServiceFeatureTitles(services.map((s) => s.id));
  const { general, contact, assistant } = settings;
  const site = publicEnv.siteUrl;

  const sections: string[] = [
    `# Company\n${general.siteName}${general.tagline ? ` — ${general.tagline}` : ""}\n${general.description}`,
    `# How to reach us\n- Contact form: ${site}/contact\n${general.contactEmail ? `- Email: ${general.contactEmail}\n` : ""}${general.whatsapp ? `- WhatsApp: ${general.whatsapp}\n` : ""}${general.location ? `- Location: ${general.location}\n` : ""}${general.businessHours ? `- Hours: ${general.businessHours}\n` : ""}- Brands and sponsors: ${site}/sponsorship\n- Existing clients: ${site}/portal/login\n${contact.budgets.length ? `- Budget ranges on the form: ${contact.budgets.join(", ")}\n` : ""}${contact.timelines.length ? `- Timelines on the form: ${contact.timelines.join(", ")}` : ""}`,
  ];
  if (services.length) {
    sections.push(
      `# Services\n${services
        .map((s) => `- ${s.title} (${site}/services/${s.slug}): ${clip(s.summary, 300)}${features.get(s.id)?.length ? ` Includes: ${features.get(s.id)!.slice(0, 5).join(", ")}.` : ""}`)
        .join("\n")}`,
    );
  }
  if (projects.length) {
    sections.push(
      `# Case studies\n${projects.map((p) => `- ${p.title}${p.category ? ` [${p.category}]` : ""} (${site}/projects/${p.slug}): ${clip(p.summary, 240)}`).join("\n")}`,
    );
  }
  if (team.length) sections.push(`# Team\n${team.map((m) => `- ${m.name}${m.roleTitle ? `, ${m.roleTitle}` : ""}${m.bio ? `: ${clip(m.bio, 200)}` : ""}`).join("\n")}`);
  if (faqs.length) sections.push(`# FAQ\n${faqs.map((f) => `Q: ${f.question}\nA: ${clip(f.answer, 400)}`).join("\n")}`);
  if (content.length) {
    sections.push(`# Recent tutorials\n${content.slice(0, 8).map((c) => `- ${c.title} (${PLATFORM_LABELS[c.platform]}) ${site}/content/${c.slug}`).join("\n")}`);
  }

  return [
    `You are the website assistant for ${general.siteName}. You help visitors understand what the studio does and how to work with it.`,
    "Rules:",
    "- Answer ONLY from the company information below. If something is not covered, say you don't know and suggest the contact form or WhatsApp. Never invent clients, prices, results, statistics, timelines or promises.",
    "- Replies are read aloud as well as shown, so keep them short: 1–3 sentences, plain text, no markdown, no bullet lists, no emojis. Mention at most one link, as a full URL.",
    "- Be warm, calm and specific. Reply in the visitor's language when you can.",
    `- When the visitor wants to start a project, hire the team, get a quote, book a call, partner as a brand or be contacted, briefly say you can pass their details to the team and end your reply with ${LEAD_MARKER}. Do not ask for their email in chat — the form collects it.`,
    "- Never ask for passwords, payment details or other sensitive information.",
    assistant.instructions.trim() ? `Additional rules from the team:\n${assistant.instructions.trim()}` : "",
    "",
    "Company information:",
    sections.join("\n\n"),
  ]
    .filter(Boolean)
    .join("\n");
}
