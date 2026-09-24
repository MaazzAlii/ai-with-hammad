# 038 — Media library backend

## Objective

Upload validation, finalize action, metadata records, rename/replace/delete with storage cleanup.

## Why This Matters

Central, validated media handling prevents dangerous uploads and orphan files.

## Dependencies

[014-storage-architecture](014-storage-architecture.md), [016-rbac](016-rbac.md)

## Files Expected To Change

- `src/server/actions/media.ts`
- `src/lib/media/validation.ts`
- `src/server/storage.ts`

## Implementation Requirements

- Validate MIME, extension, size, dimensions, duration (client + bucket + finalize)
- Reject executables/HTML; SVG only in site-assets for settings.write
- Finalize verifies storage.objects row (size/mimetype) matches
- Delete removes object and row (soft-delete blocked if referenced)

## Acceptance Criteria

- [x] Unit tests for validation; E2E upload

## Verification

- tests/unit/media-validation.test.ts
- tests/e2e/media.spec.ts

## Status

**COMPLETED**

Verified: tests/unit/media-validation.test.ts, tests/e2e/media.spec.ts (upload→finalize→edit→public URL→delete).
