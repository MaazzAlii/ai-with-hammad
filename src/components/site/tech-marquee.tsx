/** Slow, CSS-only strip of technologies (from Settings → Homepage). Pauses on hover. */
export function TechMarquee({ items }: { items: string[] }) {
  if (!items.length) return null;
  const row = (hidden: boolean) => (
    <ul className="flex shrink-0 items-center gap-10 pr-10" aria-hidden={hidden || undefined}>
      {items.map((t) => (
        <li key={t} className="text-[0.9375rem] font-medium tracking-tight whitespace-nowrap text-subtle">
          {t}
        </li>
      ))}
    </ul>
  );
  return (
    <div className="group relative flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
      <div className="marquee-track flex group-hover:[animation-play-state:paused]">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}
