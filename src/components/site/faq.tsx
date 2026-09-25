import { Plus } from "lucide-react";

import type { FaqDTO } from "@/server/dal/public/testimonials";

/** Accessible, JS-free accordion using <details>/<summary>; height animates where the browser supports it. */
export function FaqList({ items }: { items: FaqDTO[] }) {
  if (!items.length) return null;
  return (
    <div data-reveal="item" className="glass-card overflow-hidden rounded-card">
      {items.map((f) => (
        <details key={f.id} className="disclosure group border-b border-(--glass-line) last:border-b-0">
          <summary className="flex min-h-14 list-none items-center justify-between gap-4 px-5 py-4 text-[0.9875rem] font-medium text-fg transition-colors hover:bg-fg/[0.025] sm:px-6 [&::-webkit-details-marker]:hidden">
            {f.question}
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-fg/[0.05] text-muted transition-[rotate,background-color] duration-(--duration-base) ease-spring group-open:rotate-45 group-open:bg-accent-soft group-open:text-accent">
              <Plus aria-hidden className="size-4" />
            </span>
          </summary>
          <p className="px-5 pb-5 text-[0.9375rem] leading-relaxed whitespace-pre-line text-muted sm:px-6">{f.answer}</p>
        </details>
      ))}
    </div>
  );
}
