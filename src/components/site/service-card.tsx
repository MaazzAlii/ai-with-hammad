import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";

import type { ServiceSummary } from "@/server/dal/public/services";

import { ServiceIcon } from "./icons";

export function ServiceCard({ service, features }: { service: ServiceSummary; features?: string[] }) {
  return (
    <article className="group glass-card lift relative flex h-full flex-col rounded-card p-6 sm:p-7">
      <span className="mb-6 grid size-11 place-items-center rounded-[0.85rem] bg-accent-soft text-accent transition-transform duration-(--duration-slow) ease-spring group-hover:scale-105 group-hover:-rotate-3">
        <ServiceIcon name={service.icon} className="size-[1.3rem]" />
      </span>
      <h3 className="text-[1.1875rem] font-semibold tracking-tight text-fg">
        <Link href={`/services/${service.slug}`} className="after:absolute after:inset-0 after:rounded-card">
          {service.title}
        </Link>
      </h3>
      <p className="mt-2 flex-1 text-[0.9375rem] leading-relaxed text-muted">{service.summary}</p>
      {features?.length ? (
        <ul className="mt-5 space-y-2 border-t border-(--glass-line) pt-5 text-sm text-muted">
          {features.slice(0, 3).map((f) => (
            <li key={f} className="flex gap-2.5">
              <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-accent-2" strokeWidth={2} />
              {f}
            </li>
          ))}
        </ul>
      ) : null}
      <span aria-hidden className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-accent">
        Learn more <ArrowRight className="size-4 transition-transform duration-(--duration-base) ease-spring group-hover:translate-x-1" />
      </span>
    </article>
  );
}
