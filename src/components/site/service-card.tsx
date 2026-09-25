import { ArrowRight } from "lucide-react";
import Link from "next/link";

import type { ServiceSummary } from "@/server/dal/public/services";

import { ServiceIcon } from "./icons";

export function ServiceCard({ service, features }: { service: ServiceSummary; features?: string[] }) {
  return (
    <article className="group relative flex h-full flex-col rounded-card border border-border bg-surface/70 p-6 transition-[border-color,transform] duration-300 hover:-translate-y-1 hover:border-accent/40">
      <span className="mb-5 grid size-11 place-items-center rounded-control border border-accent/30 bg-accent-soft text-accent">
        <ServiceIcon name={service.icon} className="size-5" />
      </span>
      <h3 className="text-lg font-semibold text-fg">
        <Link href={`/services/${service.slug}`} className="after:absolute after:inset-0 after:rounded-card">
          {service.title}
        </Link>
      </h3>
      <p className="mt-2 flex-1 text-sm text-muted">{service.summary}</p>
      {features?.length ? (
        <ul className="mt-4 space-y-1.5 text-sm text-muted">
          {features.slice(0, 3).map((f) => (
            <li key={f} className="flex gap-2">
              <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-accent-2" />
              {f}
            </li>
          ))}
        </ul>
      ) : null}
      <span className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-accent">
        Learn more <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-1" />
      </span>
    </article>
  );
}
