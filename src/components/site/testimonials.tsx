import { Quote } from "lucide-react";

import { Stars } from "@/components/portal/star-rating";
import type { TestimonialDTO } from "@/server/dal/public/testimonials";

import { MediaImage } from "./media-image";

/** Real, approved client testimonials only (see testimonials_publish_requires_approval). */
export function TestimonialGrid({ items }: { items: TestimonialDTO[] }) {
  if (!items.length) return null;
  return (
    <ul className="columns-1 gap-5 sm:columns-2 lg:columns-3 [&>li]:mb-5">
      {items.map((t) => (
        <li key={t.id} className="reveal break-inside-avoid">
          <figure className="group relative overflow-hidden rounded-card border border-border bg-surface/70 p-6 transition-colors hover:border-accent/40">
            <Quote aria-hidden className="absolute top-4 right-4 size-8 text-accent/15" />
            <Stars rating={t.rating} />
            <blockquote className="mt-4 text-[0.95rem] leading-relaxed text-fg">“{t.quote}”</blockquote>
            <figcaption className="mt-5 flex items-center gap-3">
              {t.photo ? (
                <MediaImage media={t.photo} alt="" ratio="1/1" rounded={false} className="size-10 shrink-0 rounded-full" sizes="40px" />
              ) : (
                <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-full bg-linear-to-br from-accent/30 to-accent-2/20 font-display text-sm font-semibold text-fg">
                  {t.authorName.charAt(0)}
                </span>
              )}
              <span>
                <span className="block text-sm font-semibold text-fg">{t.authorName}</span>
                {t.authorTitle || t.company ? <span className="block text-xs text-subtle">{[t.authorTitle, t.company].filter(Boolean).join(" · ")}</span> : null}
              </span>
            </figcaption>
          </figure>
        </li>
      ))}
    </ul>
  );
}
