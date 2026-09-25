import { absoluteUrl } from "@/lib/seo";

/** Plain-text notification (no HTML → no injection surface in mail clients). */
export function inquiryNotification(kind: "contact" | "sponsorship", fields: Record<string, string>, adminPath: string) {
  const lines = Object.entries(fields)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}: ${v.replace(/\r?\n/g, "\n  ")}`);
  return {
    subject: `New ${kind} inquiry from ${fields.Name ?? "website"}`.replace(/[\r\n]+/g, " ").slice(0, 150),
    text: `${lines.join("\n")}\n\nOpen in admin: ${absoluteUrl(adminPath)}\n`,
  };
}
