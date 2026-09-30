"use client";

import { MapPin } from "lucide-react";
import { useState } from "react";

/** Click-to-load facade: no third-party iframe/cookies load until the visitor asks for the map. */
export function MapEmbed({ address }: { address: string }) {
  const [active, setActive] = useState(false);
  const src = `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;
  return (
    <div className="relative aspect-[16/9] w-full overflow-hidden rounded-media bg-surface-3 shadow-panel sm:aspect-[21/9]">
      {active ? (
        <iframe src={src} title={`Map: ${address}`} className="absolute inset-0 size-full" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
      ) : (
        <button type="button" onClick={() => setActive(true)} className="group absolute inset-0 flex size-full flex-col items-center justify-center gap-3 bg-[radial-gradient(120%_90%_at_50%_0%,var(--color-accent-soft),transparent_60%)]">
          <span className="grid size-12 place-items-center rounded-full bg-accent-soft text-accent transition-transform duration-(--duration-slow) ease-spring group-hover:scale-110">
            <MapPin aria-hidden className="size-6" />
          </span>
          <span className="max-w-xs text-center text-sm font-medium text-fg">{address}</span>
          <span className="text-xs text-muted">Tap to load the map</span>
        </button>
      )}
    </div>
  );
}
