/** Simple accessible bar list for audience breakdowns (values are admin-entered percentages). */
export function AudienceBars({ title, rows }: { title: string; rows: { label: string; percent: number }[] }) {
  if (!rows.length) return null;
  return (
    <div className="print-avoid rounded-card border border-border bg-surface/60 p-5">
      <h3 className="text-sm font-semibold text-fg">{title}</h3>
      <ul className="mt-4 space-y-3">
        {rows.map((r) => (
          <li key={r.label}>
            <div className="flex justify-between text-sm">
              <span className="text-muted">{r.label}</span>
              <span className="font-mono text-fg">{r.percent}%</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-3" aria-hidden>
              <div className="h-full rounded-full bg-linear-to-r from-accent to-accent-2" style={{ width: `${Math.min(100, Math.max(0, r.percent))}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
