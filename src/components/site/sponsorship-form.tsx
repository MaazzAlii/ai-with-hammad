"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2 } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { track } from "@vercel/analytics";
import type { z } from "zod";

import { Field, Honeypot } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";
import { Alert } from "@/components/ui/misc";
import type { ContentPlatform } from "@/db/schema";
import { sponsorshipInquirySchema } from "@/lib/validation/inquiry";
import { submitSponsorshipInquiry } from "@/server/actions/inquiries-public";

type In = z.input<typeof sponsorshipInquirySchema>;
type Out = z.output<typeof sponsorshipInquirySchema>;

const PLATFORM_OPTIONS: { value: ContentPlatform; label: string }[] = [
  { value: "youtube", label: "YouTube" },
  { value: "tiktok", label: "TikTok" },
  { value: "instagram", label: "Instagram" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "facebook", label: "Facebook" },
  { value: "x", label: "X" },
];

export function SponsorshipForm({ packages }: { packages: { id: string; name: string }[] }) {
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  // Render time for the anti-spam minimum-fill-time check (set after mount).
  const [startedAt, setStartedAt] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setStartedAt(Date.now()), 0);
    return () => clearTimeout(t);
  }, []);

  const form = useForm<In, unknown, Out>({
    resolver: zodResolver(sponsorshipInquirySchema),
    defaultValues: { name: "", email: "", company: "", website: "", packageId: "", platforms: [], budgetRange: "", timeline: "", campaignGoals: "", message: "" },
  });
  const { register, handleSubmit, formState, setError } = form;
  const e = formState.errors;

  const onSubmit = handleSubmit((values) => {
    setServerError(null);
    startTransition(async () => {
      const honeypot = (document.getElementById("sponsor-hp") as HTMLInputElement | null)?.value ?? "";
      const result = await submitSponsorshipInquiry({ ...values, website_url_confirm: honeypot, started_at: startedAt || undefined });
      if (result.ok) {
        track("inquiry_submitted", { form: "sponsorship" });
        setDone(result.message ?? "Thanks!");
        form.reset();
      } else {
        setServerError(result.error);
        for (const [k, v] of Object.entries(result.fieldErrors ?? {})) if (v?.[0]) setError(k as keyof In, { message: v[0] });
      }
    });
  });

  if (done) {
    return (
      <div role="status" className="rounded-card border border-success/30 bg-success-soft p-8 text-center">
        <CheckCircle2 aria-hidden className="mx-auto size-10 text-success" />
        <p className="mt-4 font-display text-lg font-semibold">Inquiry sent</p>
        <p className="mt-2 text-muted">{done}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="relative grid gap-5 sm:grid-cols-2">
      {serverError ? (
        <Alert tone="danger" className="sm:col-span-2">
          {serverError}
        </Alert>
      ) : null}
      <Field id="sp-name" label="Name" required error={e.name?.message}>
        <Input autoComplete="name" {...register("name")} />
      </Field>
      <Field id="sp-email" label="Work email" required error={e.email?.message}>
        <Input type="email" autoComplete="email" {...register("email")} />
      </Field>
      <Field id="sp-company" label="Company / brand" required error={e.company?.message}>
        <Input autoComplete="organization" {...register("company")} />
      </Field>
      <Field id="sp-website" label="Website" error={e.website?.message}>
        <Input type="url" placeholder="https://" {...register("website")} />
      </Field>
      {packages.length ? (
        <Field id="sp-package" label="Collaboration type" error={e.packageId?.message} className="sm:col-span-2">
          <NativeSelect {...register("packageId")}>
            <option value="">Not sure yet</option>
            {packages.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </NativeSelect>
        </Field>
      ) : null}
      <fieldset className="sm:col-span-2">
        <legend className="text-sm font-medium text-fg">Platforms of interest</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {PLATFORM_OPTIONS.map((p) => (
            <label key={p.value} className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-control border border-border-strong px-3 text-sm has-checked:border-accent has-checked:bg-accent-soft">
              <input type="checkbox" value={p.value} className="accent-[var(--color-accent)]" {...register("platforms")} />
              {p.label}
            </label>
          ))}
        </div>
      </fieldset>
      <Field id="sp-budget" label="Budget range" error={e.budgetRange?.message}>
        <Input placeholder="e.g. $2,000 – $5,000" {...register("budgetRange")} />
      </Field>
      <Field id="sp-timeline" label="Timeline" error={e.timeline?.message}>
        <Input placeholder="e.g. Q3 launch" {...register("timeline")} />
      </Field>
      <Field id="sp-goals" label="Campaign goals" error={e.campaignGoals?.message} className="sm:col-span-2">
        <Textarea rows={3} {...register("campaignGoals")} />
      </Field>
      <Field id="sp-message" label="Tell us about your product" required error={e.message?.message} className="sm:col-span-2">
        <Textarea rows={5} {...register("message")} />
      </Field>
      <Honeypot register={{ id: "sponsor-hp", name: "website_url_confirm" }} />
      <div className="flex justify-end sm:col-span-2">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Sending…" : "Send inquiry"}
        </Button>
      </div>
    </form>
  );
}
