"use client";

import { Send } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";

import { Captcha } from "@/components/forms/captcha";
import { Honeypot } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { subscribeNewsletter } from "@/server/actions/newsletter";

/** Compact email capture used in the site footer. Same anti-spam pipeline as the contact form. */
export function NewsletterForm() {
  const [pending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [captchaError, setCaptchaError] = useState<string | undefined>();
  const [captchaKey, setCaptchaKey] = useState(0);
  const [done, setDone] = useState<string | null>(null);
  const [interacted, setInteracted] = useState(false);
  const honeypotRef = useRef<HTMLInputElement>(null);
  const [startedAt, setStartedAt] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setStartedAt(Date.now()), 0);
    return () => clearTimeout(t);
  }, []);

  if (done) {
    return <p className="text-sm font-medium text-fg">{done}</p>;
  }

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!interacted) {
          setInteracted(true); // reveal the (until-now unmounted) security check first
          return;
        }
        setError(null);
        setCaptchaError(undefined);
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          let result: Awaited<ReturnType<typeof subscribeNewsletter>>;
          try {
            result = await subscribeNewsletter({
              email,
              website_url_confirm: honeypotRef.current?.value ?? "",
              started_at: startedAt || undefined,
              captchaToken: fd.get("captchaToken") ?? "",
              captchaAnswer: fd.get("captchaAnswer") ?? "",
              turnstileToken: fd.get("turnstileToken") ?? "",
            });
          } catch (err) {
            console.error("[newsletter-form] submit failed", err);
            setError("Something went wrong. Please try again.");
            setCaptchaKey((k) => k + 1);
            return;
          }
          if (result.ok) {
            setDone(result.message ?? "Thanks — you're on the list.");
          } else {
            setError(result.error);
            setCaptchaKey((k) => k + 1);
            if (result.fieldErrors?.captchaAnswer?.[0]) setCaptchaError(result.fieldErrors.captchaAnswer[0]);
          }
        });
      }}
    >
      <Honeypot register={{ name: "website_url_confirm", ref: honeypotRef }} />
      <div className="flex gap-2">
        <Input
          type="email"
          required
          placeholder="you@company.com"
          aria-label="Email address"
          value={email}
          onFocus={() => setInteracted(true)}
          onChange={(e) => {
            setInteracted(true);
            setEmail(e.target.value);
          }}
          className="min-w-0 flex-1"
        />
        <Button type="submit" size="icon" disabled={pending} aria-label="Subscribe">
          <Send aria-hidden />
        </Button>
      </div>
      {/* Only fetch a challenge once the visitor actually starts filling the form — this sits in
          the footer of every page, and a server round trip on mount for every page view is waste. */}
      {interacted ? <Captcha resetKey={captchaKey} error={captchaError} idPrefix="newsletter-captcha" /> : null}
      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </form>
  );
}
