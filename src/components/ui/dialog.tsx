"use client";

import { XIcon } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import * as React from "react";

import { cn } from "@/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

/** Dimmed, blurred backdrop shared by dialogs and sheets. */
export function DialogOverlay({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return <DialogPrimitive.Overlay className={cn("anim-overlay fixed inset-0 z-50 bg-(--scrim) backdrop-blur-[6px]", className)} {...props} />;
}

/**
 * Centered modal on larger screens; presented as a bottom sheet on phones
 * (same element, different placement + animation — see .anim-pop in globals.css).
 */
export function DialogContent({
  className,
  children,
  wide,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & { wide?: boolean }) {
  return (
    <DialogPrimitive.Portal>
      <DialogOverlay />
      <DialogPrimitive.Content
        className={cn(
          "anim-pop glass-sheet fixed z-50 flex flex-col overflow-hidden outline-none",
          "inset-x-0 bottom-0 max-h-[92dvh] rounded-t-card pb-safe",
          "sm:inset-x-auto sm:top-1/2 sm:bottom-auto sm:left-1/2 sm:max-h-[88dvh] sm:w-[calc(100%-2rem)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-card sm:pb-0",
          wide ? "sm:max-w-5xl" : "sm:max-w-lg",
          className,
        )}
        {...props}
      >
        <span aria-hidden className="mx-auto mt-2 h-1 w-9 shrink-0 rounded-full bg-fg/15 sm:hidden" />
        {children}
        <DialogPrimitive.Close
          className="pressable absolute top-3 right-3 grid size-8 place-items-center rounded-full bg-fg/[0.06] text-muted hover:bg-fg/10 hover:text-fg"
          aria-label="Close"
        >
          <XIcon className="size-4" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-1 px-5 pt-4 pb-3 pr-14 sm:px-6 sm:pt-6", className)} {...props} />;
}

export function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return <DialogPrimitive.Title className={cn("text-lg font-semibold tracking-tight", className)} {...props} />;
}

export function DialogDescription({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return <DialogPrimitive.Description className={cn("text-sm text-muted", className)} {...props} />;
}

export function DialogBody({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("overflow-y-auto overscroll-contain px-5 py-4 sm:px-6", className)} {...props} />;
}

export function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-wrap justify-end gap-2 border-t border-(--glass-line) px-5 py-4 sm:px-6", className)} {...props} />;
}
