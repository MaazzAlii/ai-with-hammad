"use client";

import { Check, Link2, Share2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

/** Native share sheet on supporting devices, falls back to copy-link everywhere else. */
export function ShareButtons({ title, className }: { title: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  const canNativeShare = typeof navigator !== "undefined" && "share" in navigator;

  const share = async () => {
    const url = window.location.href;
    if (canNativeShare) {
      try {
        await navigator.share({ title, url });
      } catch {
        // User cancelled the share sheet — nothing to do.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy the link");
    }
  };

  return (
    <Button type="button" variant="ghost" size="sm" onClick={share} className={className}>
      {copied ? <Check aria-hidden /> : canNativeShare ? <Share2 aria-hidden /> : <Link2 aria-hidden />}
      {copied ? "Copied" : "Share"}
    </Button>
  );
}
