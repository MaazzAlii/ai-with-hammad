"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Re-fetches server data periodically while the tab is visible (lightweight "live" conversations). */
export function AutoRefresh({ intervalMs = 15000, onVisible }: { intervalMs?: number; onVisible?: () => void }) {
  const router = useRouter();
  useEffect(() => {
    onVisible?.();
    const id = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs, onVisible]);
  return null;
}
