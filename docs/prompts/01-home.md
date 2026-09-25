# 01 — Homepage (`src/app/(site)/page.tsx`)

**Job of the page:** in 5 seconds a visitor knows *what we build*, sees *proof*, and has *one obvious next step*.

## Structure (top → bottom; each block hides when its data is empty)
1. **Hero** — two columns ≥ 1024 px, stacked on phones.
   - Left: optional eyebrow chip (`home.heroEyebrow`), H1 (`home.heroTitle`, `text-gradient`, max 15ch),
     subtitle (≤ 2 lines), primary CTA + secondary CTA (+ WhatsApp ghost button if configured), rating line if
     real reviews exist.
   - Right: `home.heroMediaId` image inside a `glass-panel` frame, else `AgentVisual` (illustrative agent run — no numbers).
   - Below: "Built with" `TechMarquee` (only tools actually used).
2. **Positioning** — statement heading left, paragraph right.
3. **Services** — 3-up `ServiceCard` grid, `ViewAllLink`.
4. **Selected work** — 3-up `ProjectCard` grid (4:3 covers).
5. **How we build** — one `glass-panel` split into cells (`gap-px` hairlines), not four separate cards.
6. **Process** — numbered `glass-card`s (number in a filled circle).
7. **Team** — 2 → 4 column portraits.
8. **Content** — 3-up `ContentCard` (high-performing → featured → latest).
9. **Testimonials** — masonry `TestimonialGrid`.
10. **FAQ** — heading left, `FaqList` right.
11. **Closing CTA** — large `glass-panel` + secondary partnership `glass-card`.

## Copy rules
Concrete, calm, specific. ✗ "Revolutionize your workflow" ✓ "Agents that qualify leads and draft replies for a person to approve."

## Mobile
Hero CTAs full width and stacked; `AgentVisual` below the text; section headings stack the `ViewAllLink` under the title.
