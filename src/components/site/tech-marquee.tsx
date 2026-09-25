/** Infinite, CSS-only scrolling strip of technologies (from Settings → Homepage). Pauses on hover. */
export function TechMarquee({ items }: { items: string[] }) {
  if (!items.length) return null;
  const row = (hidden: boolean) => (
    <ul className="flex shrink-0 items-center gap-3 pr-3" aria-hidden={hidden || undefined}>
      {items.map((t) => (
        <li key={t} className="rounded-full border border-border-strong bg-surface/70 px-4 py-2 font-mono text-xs whitespace-nowrap text-muted">
          {t}
        </li>
      ))}
    </ul>
  );
  return (
    <div className="marquee group relative flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
      <div className="marquee-track flex group-hover:[animation-play-state:paused]">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}
