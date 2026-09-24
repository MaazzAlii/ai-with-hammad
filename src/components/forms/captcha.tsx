"use client";

import { RefreshCw, ShieldCheck } from "lucide-react";
import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";

import { Input, Label } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getCaptchaChallenge } from "@/server/actions/captcha";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

declare global {
  interface Window {
    turnstile?: { render: (el: HTMLElement, opts: Record<string, unknown>) => string; reset: (id?: string) => void };
  }
}

/**
 * Human check rendered inside a <form>. Submits `captchaToken` + `captchaAnswer`
 * (built-in challenge) or `turnstileToken` (Cloudflare Turnstile when configured).
 * Change `resetKey` (e.g. pass the latest action state) to fetch a fresh single-use challenge.
 */
export function Captcha({ resetKey, error, idPrefix = "captcha" }: { resetKey?: unknown; error?: string; idPrefix?: string }) {
  if (SITE_KEY) return <TurnstileWidget resetKey={resetKey} error={error} />;
  return <MathChallenge resetKey={resetKey} error={error} idPrefix={idPrefix} />;
}

function MathChallenge({ resetKey, error, idPrefix }: { resetKey: unknown; error?: string; idPrefix: string }) {
  const [challenge, setChallenge] = useState<{ question: string; token: string } | null>(null);
  const [failed, setFailed] = useState(false);
  const [answer, setAnswer] = useState("");
  const load = useCallback(async () => {
    const c = await getCaptchaChallenge().catch(() => null);
    setChallenge(c);
    setFailed(!c);
    setAnswer("");
  }, []);
  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    return () => clearTimeout(t);
  }, [load, resetKey]);
  const id = `${idPrefix}-answer`;
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="flex items-center gap-2">
        <ShieldCheck aria-hidden className="size-4 text-accent-2" />
        <span data-testid="captcha-question">{challenge?.question ?? (failed ? "Security check unavailable — please retry" : "Loading security question…")}</span>
      </Label>
      <div className="flex gap-2">
        <Input
          id={id}
          name="captchaAnswer"
          inputMode="numeric"
          autoComplete="off"
          value={answer}
          onChange={(e) => setAnswer(e.target.value.replace(/[^0-9-]/g, ""))}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn("max-w-32", !challenge && "opacity-60")}
          disabled={!challenge}
        />
        <button type="button" onClick={() => void load()} className="grid size-10 place-items-center rounded-control border border-border-strong text-muted hover:text-fg" aria-label="New security question">
          <RefreshCw aria-hidden className="size-4" />
        </button>
      </div>
      <input type="hidden" name="captchaToken" value={challenge?.token ?? ""} />
      {error ? (
        <p id={`${id}-error`} className="text-xs text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function TurnstileWidget({ resetKey, error }: { resetKey: unknown; error?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const [token, setToken] = useState("");
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!ready || !ref.current || !window.turnstile) return;
    if (widgetId.current) {
      window.turnstile.reset(widgetId.current);
      return;
    }
    widgetId.current = window.turnstile.render(ref.current, { sitekey: SITE_KEY, theme: "dark", callback: (t: string) => setToken(t), "expired-callback": () => setToken("") });
  }, [ready, resetKey]);
  return (
    <div className="flex flex-col gap-1.5">
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="lazyOnload" onReady={() => setReady(true)} />
      <div ref={ref} />
      <input type="hidden" name="turnstileToken" value={token} />
      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </div>
  );
}
