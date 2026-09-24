"use server";

import { z } from "zod";

import { getDb } from "@/db";
import { siteSettings } from "@/db/schema";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { formDataToObject } from "@/lib/form-data";
import { settingsSchemas, type SettingsKey } from "@/lib/settings";

import { audit } from "../audit";
import { authorize } from "../auth/session";
import { revalidatePublicSite } from "../revalidate";
import { runAction } from "../run-action";

const json = (v: unknown) => {
  if (typeof v !== "string" || !v.trim()) return [];
  try {
    return JSON.parse(v);
  } catch {
    return [];
  }
};
const lines = (v: unknown) => (typeof v === "string" ? v.split("\n").map((s) => s.trim()).filter(Boolean) : []);
const nullable = (v: unknown) => (typeof v === "string" && v.trim() === "" ? null : v);

/** Turn flat form fields into the nested settings shape before strict validation. */
function shape(key: SettingsKey | "internal.notifications", o: Record<string, unknown>): unknown {
  switch (key) {
    case "general":
      return { ...o, logoMediaId: nullable(o.logoMediaId) };
    case "home":
      return { ...o, heroMediaId: nullable(o.heroMediaId), capabilities: json(o.capabilities), process: json(o.process), techStack: lines(o.techStack) };
    case "about":
      return { ...o, values: json(o.values) };
    case "seo":
      return { ...o, ogImageMediaId: nullable(o.ogImageMediaId) };
    case "social":
      return { links: json(o.links) };
    case "sponsorship":
      return {
        intro: o.intro,
        audienceSummary: o.audienceSummary,
        audience: { ageRanges: json(o.ageRanges), topCountries: json(o.topCountries), genderSplit: json(o.genderSplit), asOf: nullable(o.asOf) },
        contentCategories: lines(o.contentCategories),
        formats: json(o.formats),
        whyPartner: json(o.whyPartner),
        ratesNotice: o.ratesNotice,
        totalReach: null,
      };
    case "contact":
      return { intro: o.intro, budgets: lines(o.budgets), timelines: lines(o.timelines) };
    case "internal.notifications":
      return { inquiryRecipients: lines(o.inquiryRecipients) };
  }
}

const notificationsSchema = z.object({ inquiryRecipients: z.array(z.email()).max(10) });
const keySchema = z.enum(["general", "home", "about", "seo", "social", "sponsorship", "contact", "internal.notifications"]);

export async function saveSettings(keyRaw: string, _prev: unknown, fd: FormData): Promise<ActionResult<{ id?: string }>> {
  return runAction(async () => {
    const key = keySchema.parse(keyRaw) as SettingsKey | "internal.notifications";
    const staff = await authorize("settings.write");
    const schema: z.ZodType = key === "internal.notifications" ? notificationsSchema : settingsSchemas[key];
    const parsed = schema.safeParse(shape(key, formDataToObject(fd)));
    if (!parsed.success) {
      const flat = z.flattenError(parsed.error);
      return fail("Please correct the highlighted fields.", { ...flat.fieldErrors, ...(flat.formErrors.length ? { form: flat.formErrors } : {}) } as Record<string, string[]>);
    }
    await getDb()
      .insert(siteSettings)
      .values({ key, value: parsed.data, updatedBy: staff.id })
      .onConflictDoUpdate({ target: siteSettings.key, set: { value: parsed.data, updatedBy: staff.id, updatedAt: new Date() } });
    await audit(staff, { action: "settings.update", entityType: "settings", entityId: key, summary: `Updated ${key} settings` });
    revalidatePublicSite();
    return ok(undefined, "Settings saved");
  });
}
