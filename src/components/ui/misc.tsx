import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

export function Separator({ className, ...props }: React.ComponentProps<"hr">) {
  return <hr className={cn("border-0 border-t border-(--glass-line)", className)} {...props} />;
}

/** Loading placeholder with a soft travelling highlight. */
export function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      aria-hidden
      className={cn(
        "animate-shimmer rounded-control bg-fg/[0.06] bg-[linear-gradient(90deg,transparent_30%,rgb(255_255_255/0.35)_50%,transparent_70%)] bg-size-[200%_100%] dark:bg-[linear-gradient(90deg,transparent_30%,rgb(255_255_255/0.05)_50%,transparent_70%)]",
        className,
      )}
      {...props}
    />
  );
}

const ALERT_ICONS = { info: Info, success: CheckCircle2, danger: XCircle, warning: AlertTriangle };

export function Alert({
  className,
  tone = "info",
  children,
  ...props
}: React.ComponentProps<"div"> & { tone?: "info" | "success" | "danger" | "warning" }) {
  const tones = {
    info: "bg-accent-soft [&>svg]:text-accent",
    success: "bg-success-soft [&>svg]:text-success",
    danger: "bg-danger-soft [&>svg]:text-danger",
    warning: "bg-warning-soft [&>svg]:text-warning",
  };
  const Icon = ALERT_ICONS[tone];
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cn("flex items-start gap-2.5 rounded-control px-3.5 py-3 text-sm text-fg shadow-[inset_0_0_0_1px_var(--glass-line)]", tones[tone], className)}
      {...props}
    >
      <Icon aria-hidden className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

export function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div className="surface-solid w-full overflow-x-auto rounded-card">
      <table className={cn("w-full min-w-[40rem] border-collapse text-left text-sm", className)} {...props} />
    </div>
  );
}
export function Th({ className, ...props }: React.ComponentProps<"th">) {
  return <th scope="col" className={cn("label-caps border-b border-(--glass-line) bg-surface-2/70 px-4 py-3", className)} {...props} />;
}
export function Td({ className, ...props }: React.ComponentProps<"td">) {
  return <td className={cn("border-b border-(--glass-line) px-4 py-3 align-middle [tr:last-child>&]:border-b-0", className)} {...props} />;
}
