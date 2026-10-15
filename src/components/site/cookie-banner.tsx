"use client";

import { Cookie, ShieldCheck, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

const STORAGE_KEY = "aiwh_cookie_consent";

export type CookieConsentChoice = "accepted" | "essential";

export function CookieBanner() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      // Small delay for natural entrance after page load
      const timer = setTimeout(() => setIsOpen(true), 750);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    function handleOpenBanner() {
      setIsOpen(true);
    }
    window.addEventListener("open-cookie-banner", handleOpenBanner);
    return () => window.removeEventListener("open-cookie-banner", handleOpenBanner);
  }, []);

  function handleChoice(choice: CookieConsentChoice) {
    try {
      localStorage.setItem(STORAGE_KEY, choice);
      window.dispatchEvent(new CustomEvent("cookie-consent-updated", { detail: choice }));
    } catch {
      // Ignore storage errors in private browsing modes
    }
    setIsOpen(false);
  }

  if (!mounted || !isOpen) return null;

  return (
    <aside
      aria-label="Cookie preferences"
      role="region"
      className="fixed bottom-4 left-4 right-4 z-40 mx-auto max-w-lg animate-in fade-in slide-in-from-bottom-5 duration-300 ease-spring sm:bottom-6 sm:left-auto sm:right-6"
    >
      <div className="glass-panel rounded-card p-5 sm:p-6 shadow-float border border-(--glass-line) relative overflow-hidden backdrop-blur-xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-control bg-accent-soft text-accent">
              <Cookie className="size-5" strokeWidth={2} />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-fg">Your Privacy & Cookies</h3>
              <p className="text-xs text-subtle flex items-center gap-1 mt-0.5">
                <ShieldCheck className="size-3.5 text-accent" /> Cookieless analytics & essential security
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleChoice("essential")}
            className="rounded-control p-1 text-muted transition-colors hover:bg-fg/[0.06] hover:text-fg focus-visible:outline-accent"
            aria-label="Dismiss cookie notice"
          >
            <X className="size-4" />
          </button>
        </div>

        <p className="mt-3 text-xs leading-relaxed text-muted">
          We use strictly necessary cookies for security and cookieless, privacy-friendly analytics. Third-party media
          (YouTube) only loads when you choose to interact with it. Read our{" "}
          <Link href="/cookie-policy" className="text-accent underline hover:text-fg underline-offset-2">
            Cookie Policy
          </Link>{" "}
          and{" "}
          <Link href="/privacy-policy" className="text-accent underline hover:text-fg underline-offset-2">
            Privacy Policy
          </Link>
          .
        </p>

        <div className="mt-4 flex flex-wrap items-center justify-end gap-2.5 pt-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleChoice("essential")}
            className="text-xs text-muted hover:text-fg"
          >
            Essential only
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => handleChoice("accepted")}
            className="text-xs font-semibold"
          >
            Accept all
          </Button>
        </div>
      </div>
    </aside>
  );
}
