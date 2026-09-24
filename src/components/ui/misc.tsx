import * as React from "react";

import { cn } from "@/lib/utils";

export function Separator({ className, ...props }: React.ComponentProps<"hr">) {
  return <hr className={cn("border-0 border-t border-border", className)} {...props} />;
}

export function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return <div aria-hidden className={cn("animate-pulse rounded-control bg-surface-2", className)} {...props} />;
}

export function Alert({
  className,
  tone = "info",
  ...props
}: React.ComponentProps<"div"> & { tone?: "info" | "success" | "danger" | "warning" }) {
  const tones = {
    info: "border-accent/30 bg-accent-soft text-fg",
    success: "border-success/30 bg-success-soft text-fg",
    danger: "border-danger/30 bg-danger-soft text-fg",
    warning: "border-warning/30 bg-warning-soft text-fg",
  };
  return <div role={tone === "danger" ? "alert" : "status"} className={cn("rounded-card border px-4 py-3 text-sm", tones[tone], className)} {...props} />;
}

export function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div className="w-full overflow-x-auto rounded-card border border-border">
      <table className={cn("w-full min-w-[40rem] border-collapse text-left text-sm", className)} {...props} />
    </div>
  );
}
export function Th({ className, ...props }: React.ComponentProps<"th">) {
  return <th scope="col" className={cn("border-b border-border bg-surface-2 px-4 py-3 text-xs font-semibold tracking-wide text-muted uppercase", className)} {...props} />;
}
export function Td({ className, ...props }: React.ComponentProps<"td">) {
  return <td className={cn("border-b border-border px-4 py-3 align-middle", className)} {...props} />;
}
