# Build prompts — page-by-page instructions

Ready-to-use instructions for an AI coding agent (or a developer) to build or rebuild any page of this
platform so it stays consistent with the design system. Use them one at a time:

> "Read `CLAUDE.md`, `docs/DESIGN_SYSTEM.md` and `docs/prompts/00-foundations.md`, then follow
> `docs/prompts/03-projects.md`."

| File | Covers |
| --- | --- |
| [00-foundations.md](./00-foundations.md) | Rules every prompt inherits: tokens, glass hierarchy, light/dark, motion, responsive, honesty, verification |
| [01-home.md](./01-home.md) | Homepage |
| [02-services.md](./02-services.md) | Services index + detail |
| [03-projects.md](./03-projects.md) | Projects index + case-study detail (multi-image, video, links) |
| [04-team-about.md](./04-team-about.md) | Team, profiles, About |
| [05-content.md](./05-content.md) | Creator content index + detail |
| [06-sponsorship-media-kit.md](./06-sponsorship-media-kit.md) | Sponsorship + printable media kit |
| [07-contact-testimonials.md](./07-contact-testimonials.md) | Contact, testimonials, FAQ |
| [08-links.md](./08-links.md) | Link in bio (`/links`) + admin |
| [09-portal.md](./09-portal.md) | Client portal |
| [10-admin.md](./10-admin.md) | Admin shell and every CMS screen |
| [11-visual-assets.md](./11-visual-assets.md) | 3D icons, imagery style, image-generation prompts, dark/light variants |

Every prompt ends with the same **definition of done**: lint + typecheck + unit tests pass, `npm run build` passes,
screenshots at 390 px and 1440 px in both light and dark mode look right, and no section shows placeholder data.
