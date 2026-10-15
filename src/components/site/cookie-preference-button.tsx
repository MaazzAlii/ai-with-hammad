"use client";

import { SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";

export function CookiePreferenceButton() {
  return (
    <div className="mt-10 rounded-card glass-panel p-6 border border-(--glass-line)">
      <h3 className="text-base font-semibold text-fg">Update Your Preferences</h3>
      <p className="mt-1 text-sm text-muted">
        Want to modify your decision? You can re-open the cookie consent panel at any time to review or update your choices.
      </p>
      <div className="mt-4">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => window.dispatchEvent(new CustomEvent("open-cookie-banner"))}
          className="gap-2"
        >
          <SlidersHorizontal className="size-4" />
          Manage Cookie Preferences
        </Button>
      </div>
    </div>
  );
}
