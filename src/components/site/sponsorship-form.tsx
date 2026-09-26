"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { track } from "@vercel/analytics";
import type { z } from "zod";

import { Captcha } from "@/components/forms/captcha";
import { Field, Honeypot } from "@/components/forms/field";
import { FormSuccess } from "@/components/forms/form-success";
import { Button } from "@/components/ui/button";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";
import { Alert } from "@/components/ui/misc";
import { Spinner } from "@/components/ui/spinner";
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
  const [captchaKey, setCaptchaKey] = useState(0);
  const [captchaError, setCaptchaError] = useState<string | undefined>();
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

  const onSubmit = handleSubmit((values, event) => {
    setServerError(null);
    setCaptchaError(undefined);
    const formEl = (event?.target as HTMLFormElement | undefined) ?? null;
    const fd = formEl ? new FormData(formEl) : new FormData();
    startTransition(async () => {
      const honeypot = (document.getElementById("sponsor-hp") as HTMLInputElement | null)?.value ?? "";
      const captcha = { captchaToken: fd.get("captchaToken") ?? "", captchaAnswer: fd.get("captchaAnswer") ?? "", turnstileToken: fd.get("turnstileToken") ?? "" };
      let result: Awaited<ReturnType<typeof submitSponsorshipInquiry>>;
      try {
        result = await submitSponsorshipInquiry({ ...values, website_url_confirm: honeypot, started_at: startedAt || undefined, ...captcha });
      } catch (error) {
        // Network/server failure: keep the visitor's text and explain, instead of crashing the page.
        console.error("[sponsorship-form] submit failed", error);
        setServerError("We couldn't send your message just now. Please try again in a moment — your text is still here.");
        setCaptchaKey((k) => k + 1);
        return;
      }
      if (result.ok) {
        try {
          track("inquiry_submitted", { form: "sponsorship" });
        } catch {
          // Analytics must never break a successful submission.
        }
        setDone(result.message ?? "Thanks!");
        form.reset();
      } else {
        setServerError(result.error);
        setCaptchaKey((k) => k + 1);
        if (result.fieldErrors?.captchaAnswer?.[0]) setCaptchaError(result.fieldErrors.captchaAnswer[0]);
        for (const [k, v] of Object.entries(result.fieldErrors ?? {})) if (v?.[0] && k !== "captchaAnswer") setError(k as keyof In, { message: v[0] });
      }
    });
  });

  if (done) {
    return <FormSuccess title="Inquiry sent" message={done} />;
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
        <legend className="text-[0.8125rem] font-medium text-fg">Platforms of interest</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {PLATFORM_OPTIONS.map((p) => (
            <label key={p.value} className="pressable inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full bg-fg/[0.045] px-3.5 text-sm shadow-[inset_0_0_0_1px_var(--glass-line)] hover:bg-fg/[0.07] has-checked:bg-accent-soft has-checked:text-accent has-checked:shadow-[inset_0_0_0_1px_var(--color-accent)] has-focus-visible:outline-2 has-focus-visible:outline-accent">
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
      <div className="sm:col-span-2">
        <Captcha resetKey={captchaKey} error={captchaError} idPrefix="sponsor-hp-captcha" />
      </div>
      <Honeypot register={{ id: "sponsor-hp", name: "website_url_confirm" }} />
      <div className="flex justify-end border-t border-(--glass-line) pt-5 sm:col-span-2">
        <Button type="submit" size="lg" disabled={pending} className="w-full sm:w-auto">
          {pending ? <Spinner /> : null}
          {pending ? "Sending…" : "Send inquiry"}
        </Button>
      </div>
    </form>
  );
}
