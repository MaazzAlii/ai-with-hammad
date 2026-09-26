import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Capsule buttons with a tactile response: a slight scale-up on hover
 * (pointer devices only) and a press-down on :active.
 */
const buttonStyles = cva(
  [
    "relative inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-button text-sm font-medium tracking-[-0.01em] select-none",
    "transition-[transform,background-color,border-color,box-shadow,color,opacity] duration-(--duration-base) ease-spring",
    "[@media(hover:hover)]:hover:scale-[1.015] active:scale-[0.97] active:duration-75",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
    "disabled:pointer-events-none disabled:opacity-45 [&_svg]:size-4 [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        primary: [
          "bg-accent text-accent-fg shadow-glow",
          "bg-[linear-gradient(180deg,rgb(255_255_255/0.16),transparent_55%)] inset-shadow-[0_1px_0_rgb(255_255_255/0.28)]",
          "hover:bg-[color-mix(in_oklab,var(--color-accent)_90%,var(--color-fg))]",
          "dark:bg-[linear-gradient(135deg,var(--color-accent),var(--color-accent-2))] dark:hover:shadow-[0_0_36px_rgb(34_211_238/0.4)]",
        ],
        secondary: "glass-panel text-fg shadow-card hover:bg-surface",
        ghost: "text-muted hover:bg-fg/[0.05] hover:text-fg",
        outline: "border border-border-strong bg-transparent text-fg hover:border-fg/25 hover:bg-surface/60",
        danger: "bg-danger text-white dark:text-bg shadow-card inset-shadow-[0_1px_0_rgb(255_255_255/0.22)] hover:bg-[color-mix(in_oklab,var(--color-danger)_88%,black)]",
        link: "h-auto rounded-md px-0 text-accent hover:underline hover:scale-100 active:scale-100 underline-offset-4",
      },
      size: {
        sm: "h-9 px-3.5 text-[0.8125rem]",
        md: "h-10 px-4.5",
        lg: "h-12 px-6 text-[0.9375rem]",
        icon: "size-10",
      },
    },
    compoundVariants: [{ variant: "link", className: "h-auto px-0" }],
    defaultVariants: { variant: "primary", size: "md" },
  },
);

/**
 * Class string for a button look. Runs through tailwind-merge so a caller's `className`
 * (e.g. `hidden sm:inline-flex`) reliably overrides the base (`inline-flex`).
 */
export function buttonVariants({ className, ...props }: VariantProps<typeof buttonStyles> & { className?: string } = {}) {
  return cn(buttonStyles(props), className);
}

export type ButtonProps = React.ComponentProps<"button"> & VariantProps<typeof buttonStyles> & { asChild?: boolean };

export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button";
  return <Comp data-slot="button" className={buttonVariants({ variant, size, className })} {...props} />;
}
