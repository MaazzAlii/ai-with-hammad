import { cn } from "@/lib/utils";

/** iOS-style activity indicator: eight spokes stepping around (inherits currentColor). */
export function Spinner({ className, label }: { className?: string; label?: string }) {
  return (
    <span role={label ? "status" : undefined} className={cn("inline-block size-4", className)}>
      <svg aria-hidden viewBox="0 0 24 24" className="size-full animate-[spin_0.8s_steps(8)_infinite]">
        {Array.from({ length: 8 }, (_, i) => (
          <line key={i} x1="12" y1="3" x2="12" y2="7.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" opacity={0.25 + (i / 7) * 0.75} transform={`rotate(${i * 45} 12 12)`} />
        ))}
      </svg>
      {label ? <span className="sr-only">{label}</span> : null}
    </span>
  );
}
