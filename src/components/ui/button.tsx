import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import * as React from "react";

import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-button font-display text-sm font-semibold transition-[transform,background-color,border-color,box-shadow,color] duration-200 ease-out-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-linear-to-br from-accent to-accent-2 text-accent-fg shadow-glow hover:-translate-y-0.5 hover:shadow-[0_0_36px_rgb(34_211_238/0.4)]",
        secondary: "border border-border-strong bg-surface-2 text-fg hover:border-accent/50 hover:bg-surface-3",
        ghost: "text-muted hover:bg-surface-2 hover:text-fg",
        outline: "border border-border-strong text-fg hover:border-accent/60 hover:text-accent",
        danger: "bg-danger/90 text-white hover:bg-danger",
        link: "h-auto px-0 text-accent underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-9 px-3 text-[0.82rem]",
        md: "h-10 px-4",
        lg: "h-12 px-6 text-[0.95rem]",
        icon: "size-10",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export type ButtonProps = React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean };

export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button";
  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
