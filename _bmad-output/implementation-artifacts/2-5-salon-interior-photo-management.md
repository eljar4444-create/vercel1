# Story 2.5: Salon Interior Photo Management

**Epic:** 2 — Dashboard Photo Upload Flow
**Status:** in-progress
**Date:** 2026-04-14

---

## Summary

As a salon admin, I want to upload and manage interior/vibe photos for my salon without attributing them to a service or specialist, so that they appear as establishing shots on my public profile.

Split from Story 2.3 AC-004.

## Acceptance Criteria

- **AC-001:** Salon dashboard profile section has an interior photos management area (salon-only)
- **AC-002:** Photos uploaded here become `PortfolioPhoto` records with `serviceId = null, staffId = null`
- **AC-003:** Supports multi-photo upload, delete, and reorder
- **AC-004:** Photos are stored via `PortfolioPhoto` model (NOT the legacy `Profile.studioImages[]`)
- **AC-005:** Private Masters do NOT see this section
- **AC-006:** Max 12 interior photos per salon

## Architecture

### New Server Action
`uploadInteriorPhotos(formData: FormData)` — Creates `PortfolioPhoto` records with `serviceId = null, staffId = null`. Added to `src/app/actions/portfolio-photos.ts`.

### Reusable Actions
- `deletePortfolioPhoto` — already works per photo id, no changes needed
- `reorderServicePhotos` — NOT reusable (requires `serviceId`). Need new `reorderInteriorPhotos` action.

### Dashboard Component
New `InteriorPhotosSection.tsx` client component:
- Photo grid with upload, delete, reorder
- Uses `framer-motion` Reorder for drag-and-drop
- Rendered in the profile section, gated by `isSalonProvider`

### Data Flow
- Dashboard fetches interior photos: `WHERE profileId = X AND serviceId IS NULL AND staffId IS NULL`
- Passes to component as `initialPhotos`

## Anti-Patterns
- Do NOT modify existing `uploadServicePhotos` — it validates `serviceId` as required
- Do NOT touch `Profile.studioImages[]` — legacy field stays until deprecation story
- Do NOT add cookies or new DnD libraries
- Do NOT show this section for Private Masters

## Files to Touch
1. `src/app/actions/portfolio-photos.ts` — NEW actions: `uploadInteriorPhotos`, `reorderInteriorPhotos`
2. `src/components/dashboard/InteriorPhotosSection.tsx` — NEW client component
3. `src/app/dashboard/page.tsx` — fetch interior photos, render section for salons
4. `src/components/dashboard/__tests__/InteriorPhotosSection.test.tsx` — NEW tests
5. `src/app/actions/__tests__/interior-photos.test.ts` — NEW action tests
