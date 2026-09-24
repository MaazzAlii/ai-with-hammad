---
name: content-management
description: Add or extend a CMS module (list/new/edit, actions, validation, publishing, audit) following the existing patterns.
---
# Content management (CMS modules)

## Add a module `things`
1. Schema: table + RLS (database/supabase skills). Add to `ENTITIES` in `src/server/actions/cms-common.ts` if it needs publish/feature toggles, reorder or soft delete.
2. Validation: `thingSchema` in `src/lib/validation/admin.ts` (use `checkbox`, `optUrl`, `jsonArray`, `stringList` helpers).
3. Actions: `src/server/actions/things.ts` — `"use server"`, `runAction`, `assertId`, `authorize("things.write")`, ignore publish flags without `things.publish`, transaction for children, `audit()`, `revalidatePublicSite()`, return `ok({ id, redirectTo })`.
4. Admin DAL: `src/server/dal/admin/cms.ts` list + getForEdit.
5. Pages: `src/app/admin/things/{page,new/page,[id]/page}.tsx` using `AdminPageHeader`, `SortableList` + `EntityRow`, a `ThingForm` built from `AdminForm` + fields, `DeleteEntityButton`.
6. Nav: add to `ADMIN_NAV` with the right permission.
7. Public: DAL in `src/server/dal/public` (published-only DTOs) + page + sitemap.
8. Tests: E2E create/publish flow + role restriction.

## Content rules
Real data only; markdown fields render via `Markdown`; dates shown with "as of" for metrics.
