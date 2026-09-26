"use client";

import { ArrowRight, Menu, X } from "lucide-react";
import Link from "next/link";
import { Dialog as DialogPrimitive } from "radix-ui";
import { useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import type { NavLink } from "@/server/dal/public/site";

import { NavList } from "./nav-links";

const HOME: NavLink = { label: "Home", href: "/", external: false };

/**
 * Phone/tablet navigation: a menu button in the header opens a glass panel that
 * drops down from the top (Radix dialog: focus trap, Escape, focus return).
 */
export function MobileMenu({ links }: { links: NavLink[] }) {
  const [open, setOpen] = useState(false);
  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger aria-label="Open menu" className={buttonVariants({ variant: "ghost", size: "icon", className: "xl:hidden" })}>
        <Menu aria-hidden className="size-5" />
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="anim-overlay fixed inset-0 z-50 bg-(--scrim) backdrop-blur-[6px] xl:hidden" />
        <DialogPrimitive.Content className="anim-drop glass-sheet fixed inset-x-3 top-[max(0.75rem,env(safe-area-inset-top))] z-50 flex max-h-[calc(100dvh-1.5rem)] flex-col rounded-[1.75rem] outline-none xl:hidden">
          <div className="flex items-center justify-between py-2.5 pr-2.5 pl-5">
            <DialogPrimitive.Title className="text-base font-semibold tracking-tight">Menu</DialogPrimitive.Title>
            <DialogPrimitive.Close aria-label="Close menu" className={buttonVariants({ variant: "ghost", size: "icon" })}>
              <X aria-hidden className="size-5" />
            </DialogPrimitive.Close>
          </div>
          <DialogPrimitive.Description className="sr-only">Site navigation</DialogPrimitive.Description>
          <nav aria-label="Mobile" className="overflow-y-auto overscroll-contain px-3 pb-3">
            <NavList links={[HOME, ...links]} onNavigate={() => setOpen(false)} />
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <Link href="/contact" onClick={() => setOpen(false)} className={buttonVariants({ size: "lg", className: "w-full" })}>
                Start a project <ArrowRight aria-hidden />
              </Link>
              <Link href="/portal/login" onClick={() => setOpen(false)} className={buttonVariants({ size: "lg", variant: "secondary", className: "w-full" })}>
                Client portal
              </Link>
            </div>
          </nav>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
