"use client";

import { useEffect, useState, useTransition } from "react";

import { Captcha } from "@/components/forms/captcha";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Alert } from "@/components/ui/misc";
import { submitContactInquiry } from "@/server/actions/inquiries-public";

export type ChatMessage = { role: "user" | "assistant"; content: string };

/**
 * "Share your details" form inside the assistant. Goes through the same pipeline as the
 * contact form (captcha, honeypot, min fill time, rate limit, stored first, email notification)
 * and saves the recent chat with the visitor's consent.
 */
export function AssistantLeadForm({ messages, onDone }: { messages: ChatMessage[]; onDone: (message: string) => void }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [captchaKey, setCaptchaKey] = useState(0);
  const [startedAt, setStartedAt] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setStartedAt(Date.now()), 0);
    return () => clearTimeout(t);
  }, []);

  const firstNeed = messages.filter((m) => m.role === "user").map((m) => m.content).join(" ").slice(0, 500);

  const submit = (fd: FormData) => {
    setError(null);
    if (fd.get("consent") !== "on") return setError("Please tick the box so we can save your details and this chat.");
    const need = String(fd.get("need") ?? "").trim();
    const transcript = messages
      .slice(-10)
      .map((m) => `${m.role === "user" ? "Visitor" : "Assistant"}: ${m.content.replace(/\[\[LEAD_FORM\]\]/g, "").trim()}`)
      .join("\n")
      .slice(0, 3500);
    start(async () => {
      try {
        const result = await submitContactInquiry({
          name: fd.get("name"),
          email: fd.get("email"),
          company: "",
          phone: String(fd.get("phone") ?? ""),
          serviceId: "",
          budget: "",
          timeline: "",
          message: `${need}\n\n— Chat with the site assistant —\n${transcript}`.slice(0, 5000),
          source: "assistant",
          website_url_confirm: String(fd.get("website_url_confirm") ?? ""),
          started_at: startedAt || undefined,
          captchaToken: fd.get("captchaToken") ?? "",
          captchaAnswer: fd.get("captchaAnswer") ?? "",
          turnstileToken: fd.get("turnstileToken") ?? "",
        });
        if (result.ok) onDone(result.message ?? "Thanks — the team will reply by email.");
        else {
          setError(result.fieldErrors ? Object.values(result.fieldErrors).flat()[0] ?? result.error : result.error);
          setCaptchaKey((k) => k + 1);
        }
      } catch {
        setError("We couldn't send that just now. Please try again in a moment.");
        setCaptchaKey((k) => k + 1);
      }
    });
  };

  return (
    <form action={submit} className="glass-panel space-y-3 rounded-[1.25rem] p-4" noValidate>
      <p className="text-sm font-semibold tracking-tight">Share your details with the team</p>
      {error ? <Alert tone="danger">{error}</Alert> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="al-name">Name</Label>
          <Input id="al-name" name="name" autoComplete="name" required className="h-10" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="al-email">Email</Label>
          <Input id="al-email" name="email" type="email" autoComplete="email" inputMode="email" required className="h-10" />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="al-phone">WhatsApp / phone (optional)</Label>
        <Input id="al-phone" name="phone" type="tel" autoComplete="tel" className="h-10" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="al-need">What do you need?</Label>
        <Textarea id="al-need" name="need" rows={3} defaultValue={firstNeed} className="min-h-20" />
      </div>
      <Captcha resetKey={captchaKey} idPrefix="assistant-captcha" />
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Leave this field empty
          <input type="text" name="website_url_confirm" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <label className="flex items-start gap-2 text-xs leading-relaxed text-muted">
        <input type="checkbox" name="consent" className="mt-0.5 accent-[var(--color-accent)]" />
        <span>
          Save my details and this chat so the team can reply. See our{" "}
          <a href="/privacy-policy" className="underline underline-offset-2">
            privacy policy
          </a>
          .
        </span>
      </label>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Sending…" : "Send to the team"}
      </Button>
    </form>
  );
}
