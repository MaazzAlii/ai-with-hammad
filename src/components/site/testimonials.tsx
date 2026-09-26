import { Stars } from "@/components/portal/star-rating";
import type { TestimonialDTO } from "@/server/dal/public/testimonials";

import { MediaImage } from "./media-image";

/** Real, approved client testimonials only (see testimonials_publish_requires_approval). */
export function TestimonialGrid({ items }: { items: TestimonialDTO[] }) {
  if (!items.length) return null;
  return (
    <ul data-reveal="group" className="focus-group columns-1 gap-5 sm:columns-2 lg:columns-3 [&>li]:mb-5">
      {items.map((t) => (
        <li key={t.id} className="break-inside-avoid">
          <figure className="glass-card flex flex-col rounded-card p-6 sm:p-7">
            <Stars rating={t.rating} />
            <blockquote className="mt-4 text-[1rem] leading-relaxed text-fg">
              <p>“{t.quote}”</p>
            </blockquote>
            <figcaption className="mt-6 flex items-center gap-3 border-t border-(--glass-line) pt-5">
              {t.photo ? (
                <MediaImage media={t.photo} alt="" ratio="1/1" rounded={false} className="size-10 shrink-0 rounded-full" sizes="40px" />
              ) : (
                <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-full bg-accent-soft text-sm font-semibold text-accent">
                  {t.authorName.charAt(0)}
                </span>
              )}
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-fg">{t.authorName}</span>
                {t.authorTitle || t.company ? <span className="block truncate text-xs text-subtle">{[t.authorTitle, t.company].filter(Boolean).join(" · ")}</span> : null}
              </span>
            </figcaption>
          </figure>
        </li>
      ))}
    </ul>
  );
}
