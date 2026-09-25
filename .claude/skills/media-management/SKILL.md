---
name: media-management
description: Work with the media library, media fields and project media (images, galleries, diagrams, uploaded video, YouTube/Vimeo, documents).
---
# Media management

- Pick/upload in forms with `MediaField name="…Id" uploadBucket="…"` (stores `media_assets.id`).
- Project media: `ProjectMediaEditor` → JSON `media` field validated by `projectMediaItemSchema` (asset required for image/screenshot/diagram/video_upload/document; https URL for youtube/vimeo/external).
- Public rendering: images → `MediaGallery`/`MediaImage`; diagrams appear under Architecture; `video_upload` → `VideoPlayer`; YouTube/Vimeo → `VideoEmbed` via `parseVideoEmbed`; documents/links in Resources.
- Library (`/admin/media`): search/filter/sort, detail page with rename/alt/caption, replace (same kind), copy URL, usage list, delete (blocked while used).
- Alt text: set on the asset; project media can override per item.
- Large video: prefer YouTube/Vimeo for long content; uploads > 6 MB use TUS automatically (plan limit applies).
- Never download third-party videos; never store embed HTML.
