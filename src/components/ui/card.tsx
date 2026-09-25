import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Surfaces of the glass hierarchy:
 *  - card   secondary, repeated surfaces (lists, grids)
 *  - panel  primary surfaces that deserve more presence (forms, CTAs)
 *  - solid  dense content where translucency would hurt legibility
 */
export const cardVariants = cva("rounded-card", {
  variants: {
    tone: {
      card: "glass-card",
      panel: "glass-panel",
      solid: "surface-solid",
    },
  },
  defaultVariants: { tone: "card" },
});

export function Card({ className, tone, ...props }: React.ComponentProps<"div"> & VariantProps<typeof cardVariants>) {
  return <div data-slot="card" className={cn(cardVariants({ tone }), className)} {...props} />;
}

export function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-1.5 p-5 pb-0 sm:p-6 sm:pb-0", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return <h3 className={cn("text-base font-semibold text-fg", className)} {...props} />;
}

export function CardDescription({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn("text-sm text-muted", className)} {...props} />;
}

export function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("p-5 sm:p-6", className)} {...props} />;
}
