---
name: frontend-engineering
description: Build or change public/admin React UI in this Next.js 16 app: server vs client components, data flow from the DAL, forms, and component placement.
---
# Frontend engineering

## Decide server vs client
1. Default to a Server Component. Fetch through `src/server/dal/public/*` (public) or `src/server/dal/admin/*` (after `requirePagePermission`).
2. Add `"use client"` only for state, effects, event handlers, dialogs, dnd, uploads. Keep client components leaf-sized.
3. Never pass functions from a Server Component to a Client Component. Pass pre-rendered `ReactNode`s (see `SortableList` items) or server actions (inline `"use server"` closures or `action.bind(null, id)`).

## Where things go
- Primitives: `src/components/ui/*` (shadcn API: `Button`, `Input`, `NativeSelect`, `Dialog`, `Switch`, `Badge`, `Card`, `Table`).
- Public sections: `src/components/site/*`. Admin widgets: `src/components/admin/*`.
- Forms: public → React Hook Form + zod schema from `src/lib/validation/*`; admin → `AdminForm` + field components (`TextField`, `RepeaterField`, `MediaField`, `SwitchField`).

## Checklist
- [ ] Uses tokens/radius classes (`rounded-media` for images) — no hex colours.
- [ ] Sections render nothing when their data is empty (no fake placeholders).
- [ ] Links are `<Link href>`; external links get `rel="noopener noreferrer"`.
- [ ] `npm run lint && npm run typecheck`; screenshot at 390px and 1440px (`.tmp/shot.mjs` pattern in docs/TESTING.md).
