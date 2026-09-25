"use client";

import { Switch as SwitchPrimitive } from "radix-ui";
import * as React from "react";

import { cn } from "@/lib/utils";

/** iOS-proportioned toggle: the thumb stretches slightly while pressed, then springs across. */
export function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "group peer relative inline-flex h-[1.875rem] w-[3.125rem] shrink-0 items-center rounded-full bg-fg/[0.12] p-0.5 transition-colors duration-(--duration-base) ease-out-soft",
        "data-[state=checked]:bg-success disabled:cursor-not-allowed disabled:opacity-45",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          "pointer-events-none block h-[1.625rem] w-[1.625rem] rounded-full bg-white shadow-[0_2px_6px_rgb(0_0_0/0.18),0_0_0_0.5px_rgb(0_0_0/0.04)]",
          "transition-[translate,width] duration-(--duration-base) ease-spring",
          "group-active:w-[1.95rem] data-[state=checked]:translate-x-5 group-active:data-[state=checked]:translate-x-[0.95rem]",
        )}
      />
    </SwitchPrimitive.Root>
  );
}
