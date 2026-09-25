# 039 — Project media

## Objective

Cover, gallery, uploaded video, YouTube/Vimeo, external media, diagrams, screenshots, documents with drag-and-drop ordering.

## Why This Matters

Media is the core of the portfolio.

## Dependencies

[038-media-library-backend](038-media-library-backend.md), [044-project-cms](044-project-cms.md)

## Files Expected To Change

- `src/components/admin/project-media-editor.tsx`
- `src/server/actions/projects.ts`
- `src/components/site/media-gallery.tsx`

## Implementation Requirements

- project_media rows typed by project_media_type
- dnd-kit sortable ordering persisted
- Public gallery with consistent radius and optional lightbox

## Acceptance Criteria

- [x] E2E: add image + YouTube, reorder

## Verification

- tests/e2e/projects.spec.ts

## Status

**COMPLETED**

Verified in tests/e2e/admin.spec.ts (cover + gallery upload + YouTube item, order persisted, public render).
