import Link from "next/link";

import { AdminForm } from "@/components/admin/admin-form";
import { FormSection, TextAreaField, TextField } from "@/components/admin/fields";
import { MediaField } from "@/components/admin/media-picker";
import { AdminPageHeader } from "@/components/admin/page-header";
import { RepeaterField } from "@/components/admin/repeater";
import { getDb } from "@/db";
import { siteSettings } from "@/db/schema";
import { parseSettings, type Settings } from "@/lib/settings";
import { cn } from "@/lib/utils";
import { saveSettings } from "@/server/actions/settings";
import { requirePagePermission } from "@/server/auth/session";
import { getMediaMany } from "@/server/dal/admin/media";

export const metadata = { title: "Settings" };

const TABS = [
  ["general", "General"],
  ["home", "Homepage"],
  ["about", "About"],
  ["seo", "SEO"],
  ["social", "Social links"],
  ["sponsorship", "Sponsorship & audience"],
  ["contact", "Contact form"],
  ["notifications", "Notifications"],
] as const;

const titled = [{ key: "title", label: "Title" }, { key: "body", label: "Text", type: "textarea" as const }];
const pct = [{ key: "label", label: "Label" }, { key: "percent", label: "Percent" }];

export default async function SettingsPage(props: PageProps<"/admin/settings">) {
  await requirePagePermission("settings.write");
  const sp = await props.searchParams;
  const tab = TABS.find(([k]) => k === sp.tab)?.[0] ?? "general";
  const rows = await getDb().select().from(siteSettings);
  const byKey = new Map(rows.map((r) => [r.key, r.value]));
  const s = {
    general: parseSettings("general", byKey.get("general")),
    home: parseSettings("home", byKey.get("home")),
    about: parseSettings("about", byKey.get("about")),
    seo: parseSettings("seo", byKey.get("seo")),
    social: parseSettings("social", byKey.get("social")),
    sponsorship: parseSettings("sponsorship", byKey.get("sponsorship")),
    contact: parseSettings("contact", byKey.get("contact")),
  };
  const recipients = ((byKey.get("internal.notifications") as { inquiryRecipients?: string[] } | undefined)?.inquiryRecipients ?? []).join("\n");
  const media = await getMediaMany([s.general.logoMediaId, s.seo.ogImageMediaId, s.home.heroMediaId]);
  const m = (id: string | null) => (id ? (media.get(id) ?? null) : null);
  const str = (v: Settings<"sponsorship">["audience"]["ageRanges"]) => v.map((x) => ({ label: x.label, percent: String(x.percent) }));

  return (
    <>
      <AdminPageHeader title="Settings" description="Site-wide content and configuration. Changes publish immediately." />
      <nav aria-label="Settings sections" className="mb-6 flex flex-wrap gap-2">
        {TABS.map(([k, label]) => (
          <Link key={k} href={`/admin/settings?tab=${k}`} aria-current={tab === k ? "page" : undefined} className={cn("rounded-full border px-3 py-1.5 text-sm", tab === k ? "border-accent bg-accent-soft text-accent" : "border-border-strong text-muted hover:text-fg")}>
            {label}
          </Link>
        ))}
      </nav>
      <div key={tab} className="max-w-3xl">
        {tab === "general" ? (
          <AdminForm action={saveSettings.bind(null, "general")}>
            <FormSection title="Brand">
              <TextField name="siteName" label="Site name" required defaultValue={s.general.siteName} />
              <TextField name="tagline" label="Tagline" defaultValue={s.general.tagline} />
              <TextAreaField name="description" label="Organisation description" rows={3} defaultValue={s.general.description} hint="Used in the footer, sponsorship page and Organization structured data." />
              <div className="grid gap-5 sm:grid-cols-2">
                <TextField name="contactEmail" label="Public contact email" type="email" defaultValue={s.general.contactEmail} />
                <TextField name="location" label="Location" defaultValue={s.general.location} />
              </div>
              <MediaField name="logoMediaId" label="Logo" defaultMedia={m(s.general.logoMediaId)} uploadBucket="site-assets" />
            </FormSection>
          </AdminForm>
        ) : null}
        {tab === "home" ? (
          <AdminForm action={saveSettings.bind(null, "home")}>
            <FormSection title="Hero">
              <TextField name="heroEyebrow" label="Eyebrow" defaultValue={s.home.heroEyebrow} />
              <TextField name="heroTitle" label="Headline" defaultValue={s.home.heroTitle} />
              <TextAreaField name="heroSubtitle" label="Subheading" rows={2} defaultValue={s.home.heroSubtitle} />
              <MediaField name="heroMediaId" label="Hero image (optional)" defaultMedia={m(s.home.heroMediaId)} uploadBucket="site-assets" />
              <div className="grid gap-5 sm:grid-cols-2">
                <TextField name="primaryCtaLabel" label="Primary button" defaultValue={s.home.primaryCtaLabel} />
                <TextField name="primaryCtaHref" label="Primary link" defaultValue={s.home.primaryCtaHref} />
                <TextField name="secondaryCtaLabel" label="Secondary button" defaultValue={s.home.secondaryCtaLabel} />
                <TextField name="secondaryCtaHref" label="Secondary link" defaultValue={s.home.secondaryCtaHref} />
              </div>
            </FormSection>
            <FormSection title="Positioning" className="mt-6">
              <TextField name="positioningTitle" label="Title" defaultValue={s.home.positioningTitle} />
              <TextAreaField name="positioningBody" label="Text" rows={3} defaultValue={s.home.positioningBody} />
            </FormSection>
            <FormSection title="Capabilities & process" className="mt-6">
              <RepeaterField name="capabilities" label="Capabilities" columns={titled} defaultValue={s.home.capabilities} max={12} />
              <RepeaterField name="process" label="Process steps" columns={titled} defaultValue={s.home.process} max={8} />
            </FormSection>
          </AdminForm>
        ) : null}
        {tab === "about" ? (
          <AdminForm action={saveSettings.bind(null, "about")}>
            <FormSection title="About page">
              <TextField name="title" label="Title" defaultValue={s.about.title} />
              <TextAreaField name="intro" label="Intro" rows={3} defaultValue={s.about.intro} />
              <TextAreaField name="body" label="Body" rows={10} defaultValue={s.about.body} hint="Markdown supported." />
              <RepeaterField name="values" label="Principles" columns={titled} defaultValue={s.about.values} />
            </FormSection>
          </AdminForm>
        ) : null}
        {tab === "seo" ? (
          <AdminForm action={saveSettings.bind(null, "seo")}>
            <FormSection title="Search defaults" description="Used on the homepage and as fallbacks. Write for people; no keyword stuffing.">
              <TextField name="defaultTitle" label="Default title" defaultValue={s.seo.defaultTitle} maxLength={70} />
              <TextAreaField name="defaultDescription" label="Default meta description" rows={3} defaultValue={s.seo.defaultDescription} />
              <TextField name="twitterHandle" label="X/Twitter handle" defaultValue={s.seo.twitterHandle} placeholder="@handle" />
              <MediaField name="ogImageMediaId" label="Default social share image (1200×630)" defaultMedia={m(s.seo.ogImageMediaId)} uploadBucket="site-assets" hint="If empty, a branded image is generated automatically." />
            </FormSection>
          </AdminForm>
        ) : null}
        {tab === "social" ? (
          <AdminForm action={saveSettings.bind(null, "social")}>
            <FormSection title="Organisation profiles" description="Shown in the footer and as sameAs in structured data. https only.">
              <RepeaterField name="links" label="Links" columns={[{ key: "platform", label: "Platform" }, { key: "url", label: "URL", type: "url" }]} defaultValue={s.social.links} />
            </FormSection>
          </AdminForm>
        ) : null}
        {tab === "sponsorship" ? (
          <AdminForm action={saveSettings.bind(null, "sponsorship")}>
            <FormSection title="Sponsorship page">
              <TextAreaField name="intro" label="Intro" rows={3} defaultValue={s.sponsorship.intro} />
              <TextField name="ratesNotice" label="Rates notice" defaultValue={s.sponsorship.ratesNotice} hint="Public wording. Never put actual rates here." />
              <TextAreaField name="contentCategories" label="Content categories" rows={4} defaultValue={s.sponsorship.contentCategories.join("\n")} hint="One per line" />
              <RepeaterField name="formats" label="Partnership formats (shown when no packages are published)" columns={titled} defaultValue={s.sponsorship.formats} />
              <RepeaterField name="whyPartner" label="Why partner with us" columns={titled} defaultValue={s.sponsorship.whyPartner} />
            </FormSection>
            <FormSection title="Audience" description="Enter real figures from platform analytics only. Empty sections are hidden on the site." className="mt-6">
              <TextAreaField name="audienceSummary" label="Audience summary" rows={3} defaultValue={s.sponsorship.audienceSummary} />
              <RepeaterField name="ageRanges" label="Age ranges (%)" columns={pct} defaultValue={str(s.sponsorship.audience.ageRanges)} max={12} />
              <RepeaterField name="topCountries" label="Top countries (%)" columns={pct} defaultValue={str(s.sponsorship.audience.topCountries)} max={12} />
              <RepeaterField name="genderSplit" label="Gender split (%)" columns={pct} defaultValue={str(s.sponsorship.audience.genderSplit)} max={6} />
              <TextField name="asOf" label="Audience data as of" type="date" defaultValue={s.sponsorship.audience.asOf} />
            </FormSection>
          </AdminForm>
        ) : null}
        {tab === "contact" ? (
          <AdminForm action={saveSettings.bind(null, "contact")}>
            <FormSection title="Contact form">
              <TextAreaField name="intro" label="Intro" rows={3} defaultValue={s.contact.intro} />
              <TextAreaField name="budgets" label="Budget options" rows={5} defaultValue={s.contact.budgets.join("\n")} hint="One per line. Leave empty to hide the field." />
              <TextAreaField name="timelines" label="Timeline options" rows={4} defaultValue={s.contact.timelines.join("\n")} />
            </FormSection>
          </AdminForm>
        ) : null}
        {tab === "notifications" ? (
          <AdminForm action={saveSettings.bind(null, "internal.notifications")}>
            <FormSection title="Inquiry notifications" description="Internal — never shown publicly. Email delivery requires RESEND_API_KEY and EMAIL_FROM.">
              <TextAreaField name="inquiryRecipients" label="Recipients" rows={4} defaultValue={recipients} hint="One email per line (max 10)." />
            </FormSection>
          </AdminForm>
        ) : null}
      </div>
    </>
  );
}
