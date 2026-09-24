import { ChevronDown } from "lucide-react";

import type { FaqDTO } from "@/server/dal/public/testimonials";

/** Accessible, JS-free accordion using <details>/<summary>. */
export function FaqList({ items }: { items: FaqDTO[] }) {
  if (!items.length) return null;
  return (
    <div className="divide-y divide-border overflow-hidden rounded-card border border-border bg-surface/60">
      {items.map((f) => (
        <details key={f.id} className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-medium text-fg hover:bg-surface-2 [&::-webkit-details-marker]:hidden">
            {f.question}
            <ChevronDown aria-hidden className="size-4 shrink-0 text-muted transition-transform group-open:rotate-180" />
          </summary>
          <p className="px-5 pb-5 text-sm leading-relaxed whitespace-pre-line text-muted">{f.answer}</p>
        </details>
      ))}
    </div>
  );
}
