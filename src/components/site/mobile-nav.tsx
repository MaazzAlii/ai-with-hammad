"use client";

import { MenuIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { Dialog as DialogPrimitive } from "radix-ui";
import { useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import type { NavLink } from "@/server/dal/public/site";

import { NavLinks } from "./nav-links";

/** Mobile menu: Radix dialog gives focus trap, Escape to close and focus return. */
export function MobileNav({ links }: { links: NavLink[] }) {
  const [open, setOpen] = useState(false);
  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger className={buttonVariants({ variant: "ghost", size: "icon", className: "lg:hidden" })} aria-label="Open menu">
        <MenuIcon />
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm lg:hidden" />
        <DialogPrimitive.Content className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col border-l border-border bg-surface p-4 lg:hidden">
          <div className="mb-4 flex items-center justify-between">
            <DialogPrimitive.Title className="font-display text-sm font-semibold text-muted">Menu</DialogPrimitive.Title>
            <DialogPrimitive.Close className={buttonVariants({ variant: "ghost", size: "icon" })} aria-label="Close menu">
              <XIcon />
            </DialogPrimitive.Close>
          </div>
          <DialogPrimitive.Description className="sr-only">Site navigation</DialogPrimitive.Description>
          <nav aria-label="Mobile">
            <NavLinks links={[{ label: "Home", href: "/", external: false }, ...links]} vertical onNavigate={() => setOpen(false)} />
          </nav>
          <Link href="/contact" onClick={() => setOpen(false)} className={buttonVariants({ size: "lg", className: "mt-6" })}>
            Start a project
          </Link>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
