"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { setFlag } from "@/server/actions/cms-common";

/** Small pill toggle for publish/feature/pin-style flags (server enforces *.publish). */
export function FlagToggle({ entity, id, flag, value, label, disabled }: { entity: string; id: string; flag: string; value: boolean; label: string; disabled?: boolean }) {
  const router = useRouter();
  const [on, setOn] = useState(value);
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={`${label}`}
      disabled={disabled || pending}
      onClick={() =>
        start(async () => {
          const next = !on;
          setOn(next);
          const r = await setFlag(entity, id, flag, next);
          if (!r.ok) {
            setOn(!next);
            toast.error(r.error);
          } else router.refresh();
        })
      }
      className={cn(
        "inline-flex min-h-8 items-center rounded-full border px-2.5 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-60",
        on ? "border-accent/40 bg-accent-soft text-accent" : "border-border-strong text-subtle hover:text-fg",
      )}
    >
      {label}
    </button>
  );
}
