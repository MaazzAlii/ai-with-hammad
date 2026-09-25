import * as React from "react";

import { Label } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/** Label + control + hint + error, wired with aria-describedby / aria-invalid. */
export function Field({
  id,
  label,
  hint,
  error,
  required,
  className,
  children,
}: {
  id: string;
  label: React.ReactNode;
  hint?: React.ReactNode;
  error?: string;
  required?: boolean;
  className?: string;
  children: React.ReactElement<{ id?: string; "aria-invalid"?: boolean; "aria-describedby"?: string; "aria-required"?: boolean }>;
}) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={id} className={required ? "after:ml-0.5 after:text-accent after:content-['*']" : undefined}>
        {label}
        
      </Label>
      {React.cloneElement(children, { id, "aria-invalid": Boolean(error) || undefined, "aria-describedby": describedBy, "aria-required": required || undefined })}
      {hint ? (
        <p id={hintId} className="text-xs text-subtle">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-xs text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** Visually hidden honeypot input (bots fill it, humans never see it). */
export function Honeypot({ register }: { register: object }) {
  return (
    <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
      <label>
        Leave this field empty
        <input type="text" tabIndex={-1} autoComplete="off" {...register} />
      </label>
    </div>
  );
}
