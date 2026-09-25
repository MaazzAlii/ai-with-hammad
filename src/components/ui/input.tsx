import * as React from "react";

import { cn } from "@/lib/utils";

/** Filled, borderless-looking fields with a soft focus ring (iOS text-field feel). */
export const fieldBase = cn(
  "w-full rounded-control border border-transparent bg-fg/[0.045] px-3.5 text-[0.9375rem] text-fg shadow-[inset_0_0_0_1px_var(--glass-line)] placeholder:text-subtle",
  "transition-[background-color,box-shadow,border-color] duration-(--duration-fast) ease-out-soft",
  "hover:bg-fg/[0.06]",
  "focus-visible:bg-surface focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_1px_var(--color-accent),0_0_0_4px_var(--color-accent-soft)]",
  "disabled:cursor-not-allowed disabled:opacity-55",
  "aria-invalid:shadow-[inset_0_0_0_1px_var(--color-danger),0_0_0_4px_var(--color-danger-soft)]",
);

export function Input({ className, type = "text", ...props }: React.ComponentProps<"input">) {
  return <input type={type} data-slot="input" className={cn(fieldBase, "h-11", className)} {...props} />;
}

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return <textarea data-slot="textarea" className={cn(fieldBase, "min-h-28 py-3 leading-relaxed", className)} {...props} />;
}

/**
 * Native select: fully accessible, works without JS, consistent on mobile.
 * `className` sizes the wrapper (e.g. `sm:w-44`); the select fills it.
 */
export function NativeSelect({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <span className={cn("relative block", className)}>
      <select data-slot="select" className={cn(fieldBase, "h-11 appearance-none pr-10")} {...props}>
        {children}
      </select>
      <svg aria-hidden viewBox="0 0 16 16" className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-subtle" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="m4.5 6.5 3.5 3.5 3.5-3.5" />
      </svg>
    </span>
  );
}

export function Label({ className, ...props }: React.ComponentProps<"label">) {
  return <label data-slot="label" className={cn("text-[0.8125rem] font-medium text-fg", className)} {...props} />;
}
