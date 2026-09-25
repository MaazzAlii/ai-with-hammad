"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button, type ButtonProps } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { ActionResult } from "@/lib/action-result";

/** Button that runs a server action after an optional confirmation dialog, with toast feedback. */
export function ActionButton({
  action,
  confirm,
  children,
  redirectTo,
  ...buttonProps
}: {
  action: () => Promise<ActionResult<unknown>>;
  confirm?: { title: string; description: string; confirmLabel?: string };
  redirectTo?: string;
} & Omit<ButtonProps, "onClick">) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const run = () =>
    start(async () => {
      const r = await action();
      setOpen(false);
      if (r.ok) {
        toast.success(r.message ?? "Done");
        if (redirectTo) router.push(redirectTo);
        else router.refresh();
      } else toast.error(r.error);
    });
  if (!confirm) {
    return (
      <Button type="button" disabled={pending} onClick={run} {...buttonProps}>
        {children}
      </Button>
    );
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" {...buttonProps}>{children}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{confirm.title}</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <DialogDescription>{confirm.description}</DialogDescription>
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
          <Button type="button" variant="danger" disabled={pending} onClick={run}>{pending ? "Working…" : (confirm.confirmLabel ?? "Confirm")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
