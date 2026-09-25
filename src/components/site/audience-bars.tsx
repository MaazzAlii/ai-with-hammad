/** Simple accessible bar list for audience breakdowns (values are admin-entered percentages). */
export function AudienceBars({ title, rows }: { title: string; rows: { label: string; percent: number }[] }) {
  if (!rows.length) return null;
  return (
    <div className="print-avoid glass-card rounded-card p-6">
      <h3 className="text-sm font-semibold text-fg">{title}</h3>
      <ul className="mt-5 space-y-3.5">
        {rows.map((r) => (
          <li key={r.label}>
            <div className="flex justify-between text-sm">
              <span className="text-muted">{r.label}</span>
              <span className="font-medium text-fg tabular-nums">{r.percent}%</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-fg/[0.07]" aria-hidden>
              <div className="h-full rounded-full bg-accent" style={{ width: `${Math.min(100, Math.max(0, r.percent))}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
