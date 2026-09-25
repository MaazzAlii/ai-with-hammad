"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2 } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { track } from "@vercel/analytics";
import type { z } from "zod";

import { Captcha } from "@/components/forms/captcha";
import { Field, Honeypot } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";
import { Alert } from "@/components/ui/misc";
import { contactInquirySchema } from "@/lib/validation/inquiry";
import { submitContactInquiry } from "@/server/actions/inquiries-public";

type In = z.input<typeof contactInquirySchema>;
type Out = z.output<typeof contactInquirySchema>;

export function ContactForm({
  services,
  budgets,
  timelines,
  defaultServiceId = "",
}: {
  services: { id: string; title: string }[];
  budgets: string[];
  timelines: string[];
  defaultServiceId?: string;
}) {
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

  const form = useForm<In & { website_url_confirm?: string }, unknown, Out>({
    resolver: zodResolver(contactInquirySchema),
    defaultValues: { name: "", email: "", company: "", phone: "", serviceId: defaultServiceId, budget: "", timeline: "", message: "" },
  });
  const { register, handleSubmit, formState, setError } = form;
  const e = formState.errors;

  const onSubmit = handleSubmit((values, event) => {
    setServerError(null);
    setCaptchaError(undefined);
    const formEl = (event?.target as HTMLFormElement | undefined) ?? null;
    const fd = formEl ? new FormData(formEl) : new FormData();
    startTransition(async () => {
      const honeypot = (document.getElementById("contact-hp") as HTMLInputElement | null)?.value ?? "";
      const captcha = { captchaToken: fd.get("captchaToken") ?? "", captchaAnswer: fd.get("captchaAnswer") ?? "", turnstileToken: fd.get("turnstileToken") ?? "" };
      const result = await submitContactInquiry({ ...values, website_url_confirm: honeypot, started_at: startedAt || undefined, ...captcha });
      if (result.ok) {
        track("inquiry_submitted", { form: "contact" });
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
    return (
      <div role="status" className="rounded-card border border-success/30 bg-success-soft p-8 text-center">
        <CheckCircle2 aria-hidden className="mx-auto size-10 text-success" />
        <p className="mt-4 font-display text-lg font-semibold">Message sent</p>
        <p className="mt-2 text-muted">{done}</p>
        <Button variant="secondary" className="mt-6" onClick={() => setDone(null)}>
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="relative grid gap-5 sm:grid-cols-2" aria-describedby={serverError ? "contact-error" : undefined}>
      {serverError ? (
        <Alert tone="danger" id="contact-error" className="sm:col-span-2">
          {serverError}
        </Alert>
      ) : null}
      <Field id="name" label="Name" required error={e.name?.message}>
        <Input autoComplete="name" {...register("name")} />
      </Field>
      <Field id="email" label="Email" required error={e.email?.message}>
        <Input type="email" autoComplete="email" inputMode="email" {...register("email")} />
      </Field>
      <Field id="company" label="Company" error={e.company?.message}>
        <Input autoComplete="organization" {...register("company")} />
      </Field>
      <Field id="phone" label="Phone" error={e.phone?.message}>
        <Input type="tel" autoComplete="tel" {...register("phone")} />
      </Field>
      {services.length ? (
        <Field id="serviceId" label="Service" error={e.serviceId?.message} className="sm:col-span-2">
          <NativeSelect {...register("serviceId")}>
            <option value="">Not sure yet</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </NativeSelect>
        </Field>
      ) : null}
      {budgets.length ? (
        <Field id="budget" label="Budget" error={e.budget?.message}>
          <NativeSelect {...register("budget")}>
            <option value="">Select a range</option>
            {budgets.map((b) => (
              <option key={b}>{b}</option>
            ))}
          </NativeSelect>
        </Field>
      ) : null}
      {timelines.length ? (
        <Field id="timeline" label="Timeline" error={e.timeline?.message}>
          <NativeSelect {...register("timeline")}>
            <option value="">Select a timeline</option>
            {timelines.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </NativeSelect>
        </Field>
      ) : null}
      <Field id="message" label="What would you like to build?" required error={e.message?.message} hint="The process, the tools involved and what success looks like." className="sm:col-span-2">
        <Textarea rows={6} {...register("message")} />
      </Field>
      <div className="sm:col-span-2">
        <Captcha resetKey={captchaKey} error={captchaError} idPrefix="contact-hp-captcha" />
      </div>
      <Honeypot register={{ id: "contact-hp", name: "website_url_confirm" }} />
      <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-subtle">
          We use your details only to reply. See our <a href="/privacy-policy" className="underline hover:text-fg">privacy policy</a>.
        </p>
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Sending…" : "Send message"}
        </Button>
      </div>
    </form>
  );
}
