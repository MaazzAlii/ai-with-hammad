/**
 * Decorative hero visual: an animated agent workflow (pure SVG + CSS, no JS).
 * It illustrates how the studio builds systems — it does not claim any metrics.
 */
const NODES = [
  { x: 68, y: 70, label: "Trigger", sub: "webhook · form" },
  { x: 250, y: 70, label: "AI agent", sub: "LLM + guardrails", core: true },
  { x: 440, y: 30, label: "CRM", sub: "tool" },
  { x: 440, y: 110, label: "Database", sub: "tool" },
  { x: 250, y: 190, label: "Human review", sub: "approve / edit" },
  { x: 440, y: 190, label: "Result", sub: "sent · logged" },
];
const EDGES: [number, number][] = [
  [0, 1],
  [1, 2],
  [1, 3],
  [1, 4],
  [4, 5],
];

export function AgentVisual() {
  return (
    <figure className="relative mx-auto w-full max-w-xl">
      <div aria-hidden className="absolute -inset-6 rounded-[2rem] bg-linear-to-br from-accent/15 via-transparent to-accent-2/10 blur-2xl" />
      <div className="relative overflow-hidden rounded-media border border-border-strong/70 bg-surface/70 shadow-2xl backdrop-blur">
        <div className="flex items-center gap-1.5 border-b border-border px-4 py-2.5">
          <span className="size-2.5 rounded-full bg-danger/70" />
          <span className="size-2.5 rounded-full bg-warning/70" />
          <span className="size-2.5 rounded-full bg-success/70" />
          <span className="ml-3 font-mono text-[0.68rem] tracking-wider text-subtle">agent-workflow.run</span>
        </div>
        <svg viewBox="0 0 520 240" className="block w-full" role="img" aria-label="Illustration of an AI agent workflow: a trigger starts an AI agent that uses CRM and database tools, a human reviews, and the result is sent and logged.">
          <defs>
            <linearGradient id="edge" x1="0" x2="1">
              <stop offset="0" stopColor="#22d3ee" stopOpacity="0.9" />
              <stop offset="1" stopColor="#2dd4bf" stopOpacity="0.6" />
            </linearGradient>
            <radialGradient id="core" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0" stopColor="#22d3ee" stopOpacity="0.55" />
              <stop offset="1" stopColor="#22d3ee" stopOpacity="0" />
            </radialGradient>
          </defs>
          {EDGES.map(([a, b], i) => {
            const A = NODES[a]!;
            const B = NODES[b]!;
            return (
              <g key={i}>
                <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke="#1e2e3b" strokeWidth="2" />
                <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke="url(#edge)" strokeWidth="2" strokeDasharray="6 10" className="agent-flow" style={{ animationDelay: `${i * 0.35}s` }} />
              </g>
            );
          })}
          {NODES.map((n) => (
            <g key={n.label} transform={`translate(${n.x} ${n.y})`}>
              {n.core ? <circle r="46" fill="url(#core)" className="agent-pulse" /> : null}
              <rect x="-52" y="-20" width="104" height="40" rx="10" fill="#0b131b" stroke={n.core ? "#22d3ee" : "#2b4050"} strokeWidth={n.core ? 1.5 : 1} />
              <text y="-2" textAnchor="middle" fill="#e8f1f2" fontSize="11.5" fontWeight="600" fontFamily="var(--font-display), sans-serif">{n.label}</text>
              <text y="12" textAnchor="middle" fill="#7d949e" fontSize="8.5" fontFamily="var(--font-mono), monospace">{n.sub}</text>
            </g>
          ))}
        </svg>
        <div aria-hidden className="border-t border-border bg-bg/60 px-4 py-3 font-mono text-[0.7rem] leading-relaxed">
          {[
            ["text-subtle", "› trigger", "new lead received"],
            ["text-accent", "› agent", "classify intent → qualify → draft reply"],
            ["text-accent-2", "› tools", "crm.upsert ✓  db.log ✓"],
            ["text-warning", "› review", "awaiting approval…"],
            ["text-success", "› done", "reply sent · run logged"],
          ].map(([cls, k, v], i) => (
            <p key={k} className="agent-log truncate" style={{ animationDelay: `${0.6 + i * 0.7}s` }}>
              <span className={cls}>{k}</span> <span className="text-muted">{v}</span>
            </p>
          ))}
        </div>
      </div>
      <figcaption className="sr-only">Illustrative agent workflow</figcaption>
    </figure>
  );
}
