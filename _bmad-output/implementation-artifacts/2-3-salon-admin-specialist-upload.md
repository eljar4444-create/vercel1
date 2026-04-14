# Story 2.3: Salon Admin — Specialist + Service Photo Upload

Status: review

## Story

As a salon admin,
I want to upload photos into a specific specialist's service folder,
so that photos are attributed to both the specialist (`staffId`) and the service (`serviceId`).

## Why This Story Exists (Context)

Epic 2 delivered per-service upload curation for Private Masters (Stories 2.1 + 2.2). Salon providers have been explicitly excluded so far — `ServicesSection` passes `showPhotoUpload={!isSalonProvider}` ([ServicesSection.tsx:121](src/components/dashboard/ServicesSection.tsx#L121)), so salon admins currently see zero upload affordance in the dashboard.

The blueprint's premise is that Salon photos must carry **three attributions**: `profileId` (the salon), `serviceId` (the service this photo demonstrates), and `staffId` (the specialist who did the work). Without staff attribution the salon deep-dive modal ([BLUEPRINT §2.3 TeamSection](_bmad-output/BLUEPRINT-salon-slug-redesign.md#L113) and §5.2) cannot show "Anna's 45 photos"; the specialist watermark on salon photos ([BLUEPRINT §2.5](_bmad-output/BLUEPRINT-salon-slug-redesign.md#L210)) can't render.

**The backend is already in place** — this is again a pure-frontend story:
- [`uploadServicePhotos(formData)`](src/app/actions/portfolio-photos.ts#L19) already reads `formData.get('staffId')`, validates that `staffId` belongs to the same `profileId` as the service, and persists it to the new `PortfolioPhoto` record. Test coverage at [portfolio-photos.test.ts:149-232](src/app/actions/__tests__/portfolio-photos.test.ts#L149).
- [`reorderServicePhotos`](src/app/actions/portfolio-photos.ts#L119) + [`deletePortfolioPhoto`](src/app/actions/portfolio-photos.ts#L253) work unchanged — auth already accepts salon admins who own the profile.

So this story **extends the existing `ServicePhotoUpload` component** with an optional `staffId` prop that gets forwarded as a FormData field, and **adds a specialist-scoped entry point** in the salon dashboard — a modal reached from each `StaffSection` card, where the admin picks a service and uploads photos for that (staff, service) pair.

**Scope boundary — interior photos deferred.** Epic AC-004 ("Salon admin can also upload interior/vibe photos via Salon Settings → Interior Photos") requires a NEW server action (`uploadServicePhotos` hard-requires `serviceId`), a new dashboard section, and new curation semantics. Ship that as separate Story **2.5 — Salon Interior Photo Management**. This story stays laser-focused on staff-scoped upload. Sprint yaml updated to add the 2.5 slot.

**No DnD needed.** This story reuses `ServicePhotoUpload` unchanged for the strip; only adds the `staffId` prop + wiring at the new entry point.

## Acceptance Criteria

1. **AC-001 — Entry point:** In the salon dashboard's **Команда мастеров** section ([StaffSection.tsx](src/components/dashboard/StaffSection.tsx)), each staff card exposes a new **"Фотографии работ"** action (icon or button). Clicking it opens a modal titled `Фотографии · {staff.name}`.

2. **AC-002 — Service picker inside modal:** The modal renders a **vertical list of services** for the current salon profile. Each item shows service name + photo count for THIS staff member (`count(photos where serviceId = S and staffId = T)`) and expands on click to reveal a `ServicePhotoUpload` instance scoped to `(serviceId, staffId = T)`.

3. **AC-003 — Staff-scoped view:** Within the modal, the `ServicePhotoUpload` strip shows **only this specialist's photos for this service** (filtered `staffId === T`). Photos attributed to other specialists or to no specialist are hidden from this view to keep curation clear.

4. **AC-004 — Upload attribution:** When the salon admin uploads photos via the modal, the created `PortfolioPhoto` records have:
   - `profileId` = the salon's profile
   - `serviceId` = the service selected in the modal
   - `staffId` = the specialist whose card was opened
   
   The new `ServicePhotoUpload` prop `staffId?: string` is forwarded as a `FormData.append('staffId', staffId)` — the server action already handles this field.

5. **AC-005 — Delete scoped correctly:** Deleting a photo from the staff-scoped view removes **only that photo** (server action is per-photo-id; no spillover). Confirmation dialog unchanged (`window.confirm('Удалить это фото?')`).

6. **AC-006 — Reorder/cover deferred in the staff-scoped view:** The existing `reorderServicePhotos` is service-scoped (operates on the full photo list for the service). A staff-filtered reorder would require a backend change. For this story:
   - Reorder drag handles and "Set as cover" buttons are **hidden** when `ServicePhotoUpload` is rendered with a `staffId` prop. Only upload + delete are exposed in staff-scoped mode.
   - Cover badge still renders on whichever photo is `position: 0` within the staff-filtered list (which is just "the first uploaded" under the current append-only semantics).
   - A follow-up story (tracked as 2.6 or folded into Epic 3/4) will introduce staff-scoped reorder semantics. Leave a `TODO(2.6)` comment at the reorder branch.

7. **AC-007 — Salon admins keep `showPhotoUpload={false}` on the main Services section.** The top-level `ServicesSection` behavior is unchanged — salon admins don't see per-service upload there. All salon uploads happen through the staff-scoped modal (AC-001).

8. **AC-008 — Auth guard reuse:** No new auth code. The existing session/profile/ownership checks inside `uploadServicePhotos` + `deletePortfolioPhoto` are sufficient; salon admins authenticated as the profile owner pass those checks unchanged.

9. **AC-009 — Zero regressions:**
   - Private Master upload flow (Stories 2.1 + 2.2) unchanged.
   - Salon's main Services section renders identically to today.
   - Existing StaffSection card grid, add-staff form, delete-staff behavior untouched.
   - No changes to `uploadServicePhotos`, `reorderServicePhotos`, `deletePortfolioPhoto` server action signatures.

10. **AC-010 — Tests:**
    - `ServicePhotoUpload` test: new case — when `staffId` prop is provided, `FormData.get('staffId')` matches on upload. Reorder/cover buttons are NOT rendered.
    - `ServicePhotoUpload` test: when `staffId` prop is absent, behavior is identical to today (the 15 existing tests must stay green).
    - New test file `StaffPhotosModal.test.tsx`: opens modal for a staff member, expands a service row, verifies `ServicePhotoUpload` receives the correct `serviceId` + `staffId` props.
    - Full suite (`npx vitest run`) stays green; baseline post-2.2 is **201 tests** — story target is **~205-207** (3-5 new tests).

## Tasks / Subtasks

- [x] Task 1: Extend `ServicePhotoUpload` with optional `staffId` + staff-scoped mode (AC: 003, 004, 006)
  - [x] 1.1: Add `staffId?: string` to `ServicePhotoUploadProps`
  - [x] 1.2: In `handleChange`, append `fd.append('staffId', staffId)` when prop is present
  - [x] 1.3: When `staffId` prop is present, hide reorder cursor (`cursor-default`, remove `whileDrag`), hide the Star "Set-as-cover" overlay buttons. Cover badge at idx 0 still renders. Delete button still renders.
  - [x] 1.4: When `staffId` is present, replace `<Reorder.Group>` with a plain `<div>` strip (no drag) — avoids the onReorder round-trip entirely. Document the `TODO(2.6)` at this branch.

- [x] Task 2: Extend `ServicePhotoUpload` tests (AC: 004, 006, 010)
  - [x] 2.1: New test: upload with `staffId` prop → `FormData.get('staffId')` equals prop value
  - [x] 2.2: New test: render with `staffId` prop → no "Сделать обложкой" buttons, no drag cursor class
  - [x] 2.3: Sanity: existing 15 tests (no-staff mode) still pass

- [x] Task 3: Build `StaffPhotosModal` client component (AC: 001, 002, 003)
  - [x] 3.1: New file `src/components/dashboard/StaffPhotosModal.tsx`
  - [x] 3.2: Props: `staff: { id: string; name: string }`, `services: Array<{ id: number; title: string; photos: ServicePhoto[] }>`, `onClose: () => void`
  - [x] 3.3: Render modal shell matching `ServicesSection` pattern ([ServicesSection.tsx:58-97](src/components/dashboard/ServicesSection.tsx#L58-L97)) — fixed overlay, close button, max height scroll body
  - [x] 3.4: Title `Фотографии · {staff.name}`
  - [x] 3.5: Body: map `services` → collapsible row per service. Collapsed = name + `{N} фото`. Expanded = `<ServicePhotoUpload serviceId={s.id} staffId={staff.id} initialPhotos={s.photos.filter(p => p.staffId === staff.id)} />`
  - [x] 3.6: One row expanded at a time (single `expandedServiceId` state)
  - [x] 3.7: Empty state when `services.length === 0`: "Добавьте услуги, чтобы прикрепить к ним фотографии мастера."

- [x] Task 4: Wire dashboard data fetch for staff-scoped photos (AC: 002, 003)
  - [x] 4.1: In [dashboard/page.tsx](src/app/dashboard/page.tsx), extend the `services` query for salon providers to `include: { photos: { orderBy: { position: 'asc' }, select: { id, url, position, staffId } } }` (`staffId` added — it's already selected for services in the dashboard fetch via [dashboard/page.tsx:282-286](src/app/dashboard/page.tsx#L282-L286), just add `staffId` to the select)
  - [x] 4.2: Pass `serializedServices` (already shaped) through to `StaffSection` via new prop `services` (for the modal)
  - [x] 4.3: Update `ServicePhoto` type in [ServicePhotoUpload.tsx:16-20](src/components/dashboard/ServicePhotoUpload.tsx#L16-L20) to include optional `staffId: string | null`

- [x] Task 5: Add entry point to `StaffSection` (AC: 001)
  - [x] 5.1: New prop `services: ServiceData[]` on `StaffSection` (threaded from dashboard)
  - [x] 5.2: Each staff card gets a `<Camera>` or `<ImageIcon>` button with `aria-label="Фотографии работ"` — placed next to the existing delete button, same visual weight
  - [x] 5.3: Clicking sets `photosStaffId` state; the modal renders when non-null
  - [x] 5.4: Modal close clears `photosStaffId`

- [x] Task 6: `StaffPhotosModal` tests (AC: 001, 002, 010)
  - [x] 6.1: New file `src/components/dashboard/__tests__/StaffPhotosModal.test.tsx`
  - [x] 6.2: Mock `@/components/dashboard/ServicePhotoUpload` to a lightweight stub that records its props
  - [x] 6.3: Test: renders service list filtered to salon's services with correct photo counts per staff
  - [x] 6.4: Test: clicking a service row expands and mounts `ServicePhotoUpload` with `serviceId + staffId` props; collapsed photos filtered to `staffId === expected`
  - [x] 6.5: Test: empty services array → empty state string

- [ ] Task 7: Manual smoke test plan (for user — AC: all)
  - [ ] 7.1: `npm run dev`. Login as a salon profile with ≥1 staff member + ≥1 service.
  - [ ] 7.2: Navigate Dashboard → Сотрудники → click photos icon on a staff card → modal opens.
  - [ ] 7.3: Expand a service row → upload 2 photos → verify they appear in the strip.
  - [ ] 7.4: Close modal, reopen for same staff → photos persist.
  - [ ] 7.5: Verify in DB / Prisma Studio that new `PortfolioPhoto` rows have `profileId + serviceId + staffId` all populated.
  - [ ] 7.6: Verify in `/salon/[slug]` profile page that the uploaded photos now appear in the service strip (Story 1.4 integration should show them).
  - [ ] 7.7: Delete one photo from the modal → confirmation dialog → confirm → photo removed.
  - [ ] 7.8: Open the modal for a DIFFERENT staff member; verify the previous staff's photos are NOT visible (filtered by `staffId`).
  - [ ] 7.9: No regression — private master dashboard still works as before.

- [x] Task 8: Verify end-to-end (AC: 009)
  - [x] 8.1: `npx vitest run` — **23 files / 209 tests** (was 201; +8 new), 0 failures
  - [x] 8.2: `npm run lint` — 4 pre-existing warnings unchanged, 0 new
  - [x] 8.3: `npm run build` — passes (dashboard bundle 137 kB; no regression)
  - [x] 8.4: `npx tsc --noEmit` — 0 new type errors in touched files

## Dev Notes

### Why a modal and not a new route

Matches the existing `ServicesSection` UX ([ServicesSection.tsx:53-97](src/components/dashboard/ServicesSection.tsx#L53)) — dashboard uses modals for nested editing flows. A new route (`/dashboard/staff/[id]/photos`) would require URL parsing, state on navigation, and breaks the "stay in context" feel. Modal is shorter, matches conventions.

### Why staff-scoped reorder is deferred

`reorderServicePhotos(serviceId, photoIdOrder[])` validates:
```ts
if (photoIdOrder.length !== validIds.size) {
    return { success: false, error: 'Неполный список фото.' };
}
```
This rejects partial lists — it requires the FULL service photo order. If we wanted a staff-scoped reorder (just Anna's photos for "Haircut"), we'd need either:
- New action `reorderStaffServicePhotos(serviceId, staffId, photoIdOrder[])` that fetches only `staffId`-matched photos and reorders among themselves (preserving gaps for other staff's positions), or
- Global reorder where salon admin sees all staff's photos mixed (poor UX — overloads the curation view)

Clean path: new backend action in a follow-up story (2.6). For THIS story, reorder/cover actions are hidden in staff-scoped mode so the admin can still upload + delete confidently.

### Reference pattern — optional `staffId` on `ServicePhotoUpload`

```tsx
interface ServicePhotoUploadProps {
    serviceId: number;
    staffId?: string;                       // NEW
    initialPhotos: ServicePhoto[];
}

export function ServicePhotoUpload({ serviceId, staffId, initialPhotos }: ServicePhotoUploadProps) {
    // ...existing state...
    const staffScoped = Boolean(staffId);

    const handleChange = async (e) => {
        // ...existing validation...
        const fd = new FormData();
        fd.set('serviceId', String(serviceId));
        if (staffId) fd.append('staffId', staffId);    // NEW
        for (const f of files) fd.append('photos', f);
        const result = await uploadServicePhotos(fd);
        // ...
    };

    // In JSX:
    // staffScoped ? <div className="flex gap-2 overflow-x-auto pb-1">...</div>
    //             : <Reorder.Group axis="x" ...>
    // Star "Set-as-cover" button: hide when staffScoped
}
```

### Reference pattern — `StaffPhotosModal`

```tsx
'use client';

import { useState } from 'react';
import { Camera, X } from 'lucide-react';
import { ServicePhotoUpload, type ServicePhoto } from '@/components/dashboard/ServicePhotoUpload';

interface StaffPhotosModalProps {
    staff: { id: string; name: string };
    services: Array<{
        id: number;
        title: string;
        portfolioPhotos: Array<ServicePhoto & { staffId?: string | null }>;
    }>;
    onClose: () => void;
}

export function StaffPhotosModal({ staff, services, onClose }: StaffPhotosModalProps) {
    const [expandedId, setExpandedId] = useState<number | null>(null);

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-3 sm:items-center">
            <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                    <h3 className="text-base font-semibold text-slate-900">
                        Фотографии · {staff.name}
                    </h3>
                    <button onClick={onClose} aria-label="Закрыть" className="...">
                        <X className="h-4 w-4" />
                    </button>
                </div>
                <div className="max-h-[80vh] overflow-y-auto p-4 space-y-2">
                    {services.length === 0 ? (
                        <p className="py-8 text-center text-sm text-gray-400">
                            Добавьте услуги, чтобы прикрепить к ним фотографии мастера.
                        </p>
                    ) : services.map((s) => {
                        const staffPhotos = s.portfolioPhotos.filter(
                            (p) => p.staffId === staff.id
                        );
                        const expanded = expandedId === s.id;
                        return (
                            <div key={s.id} className="rounded-xl border border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setExpandedId(expanded ? null : s.id)}
                                    className="flex w-full items-center justify-between px-3 py-2 text-sm"
                                >
                                    <span className="font-medium text-gray-900">{s.title}</span>
                                    <span className="text-xs text-gray-500">{staffPhotos.length} фото</span>
                                </button>
                                {expanded && (
                                    <div className="border-t border-gray-100 px-3 py-2">
                                        <ServicePhotoUpload
                                            serviceId={s.id}
                                            staffId={staff.id}
                                            initialPhotos={staffPhotos}
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
```

### Why filter photos client-side (not via a new backend query)

The dashboard already fetches all `services.photos` for salon providers — that fetch is paid once. Filtering `photos.filter(p => p.staffId === staff.id)` is O(N) per staff, cheap. A dedicated API would be overkill for the current scale (salons with <50 photos per service).

If this ever becomes a performance concern, introduce `GET /api/staff/[id]/photos` with proper pagination — but that's a future concern, not this story.

### Data shape — `ServicePhoto` extension

Current type:
```ts
export interface ServicePhoto {
    id: string;
    url: string;
    position: number;
}
```

Extended:
```ts
export interface ServicePhoto {
    id: string;
    url: string;
    position: number;
    staffId?: string | null;   // NEW — only populated for salon-scoped fetches
}
```

Private master flow ignores this field (staff is always null for private masters), so no breaking change.

### Anti-Patterns to Avoid

- **DO NOT** create a new server action for staff-scoped upload. `uploadServicePhotos` already accepts `staffId` in FormData.
- **DO NOT** modify `reorderServicePhotos` to be staff-filtered in this story — scope creep. Hide reorder UI when `staffId` is present; follow-up story.
- **DO NOT** add a new DB column, new table, or new migration. This is UI-only + FormData threading.
- **DO NOT** render the per-service upload strip inside the salon's main Services section — `showPhotoUpload={!isSalonProvider}` stays.
- **DO NOT** fetch salon photos via a separate API call from the modal — they're already in the server-rendered `serializedServices`. Thread them in as props.
- **DO NOT** introduce a new DnD library.
- **DO NOT** touch the legacy `Service.images` field.
- **DO NOT** localize strings to English.

### Previous Story Intelligence

- **Story 1.4:** `uploadServicePhotos` canonical server action — already `staffId`-aware. Test proof at [portfolio-photos.test.ts:149-232](src/app/actions/__tests__/portfolio-photos.test.ts#L149).
- **Story 2.1:** `ServicePhotoUpload.tsx` created, rendered from `ServicesSection` → `ServiceList` when `showPhotoUpload` is truthy.
- **Story 2.2:** `ServicePhotoUpload.tsx` now includes `Reorder.Group` + cover badge + delete overlay. This story adds a **flag** (`staffId` prop = "staff-scoped mode") that swaps the reorder container for a plain div and hides reorder-only affordances.

### Verification Commands

```bash
npm run dev                       # manual smoke in browser
npx vitest run                    # full test suite
npx vitest run src/components/dashboard/__tests__/ServicePhotoUpload
npx vitest run src/components/dashboard/__tests__/StaffPhotosModal
npm run lint
npx tsc --noEmit
npm run build
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.3]
- [Source: _bmad-output/BLUEPRINT-salon-slug-redesign.md §2.3 TeamSection] — specialist cards
- [Source: _bmad-output/BLUEPRINT-salon-slug-redesign.md §5.2 Data Model] — (profileId, serviceId, staffId) tri-attribution rationale
- [Source: src/app/actions/portfolio-photos.ts#L19 — uploadServicePhotos (staffId-aware)]
- [Source: src/app/actions/__tests__/portfolio-photos.test.ts#L149 — staffId upload test coverage]
- [Source: src/components/dashboard/StaffSection.tsx — integration target for entry point]
- [Source: src/components/dashboard/ServicesSection.tsx#L53-L97 — modal pattern to mirror]
- [Source: src/components/dashboard/ServicePhotoUpload.tsx — component to extend]
- [Source: src/app/dashboard/page.tsx#L278-L336 — services fetch + serialization]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (Amelia persona, BMAD dev-story workflow)

### Debug Log References

- Backend `uploadServicePhotos` already forwards `staffId` — verified by existing test suite ([portfolio-photos.test.ts:149-232](src/app/actions/__tests__/portfolio-photos.test.ts#L149)). No server action changes needed.
- Dashboard data pipeline extended at [dashboard/page.tsx:284](src/app/dashboard/page.tsx#L284) and [dashboard/page.tsx:332-335](src/app/dashboard/page.tsx#L332-L335) — `staffId` now selected + serialized.
- Lint baseline preserved (4 pre-existing warnings unchanged, 0 new).
- Typecheck clean on touched files.

### Completion Notes List

- **`ServicePhotoUpload` dual-mode**: introduced `staffScoped = Boolean(staffId)`. In staff-scoped mode the thumbnail strip renders as a plain `<div>` (no `Reorder.Group`), drag cursor removed, the "Сделать обложкой" (Star) button is not rendered. Cover badge at `idx === 0` + per-photo delete still work.
- **Thumbnail rendering extracted** into `renderThumb(photo, idx)` helper so the same JSX is shared between `Reorder.Item` and the plain-div branch. Keeps cover badge + delete/set-cover overlay single-sourced.
- **FormData threading**: `fd.append('staffId', staffId)` when the prop is present. Server already validates ownership.
- **`StaffPhotosModal`**: new component matching the `ServicesSection` modal shell. Service list is collapsible; only one row expanded at a time. Each expanded row mounts `ServicePhotoUpload` scoped to `(serviceId, staffId)` with `initialPhotos` filtered to `staffId === staff.id`.
- **Photo count labeling**: renders `"{N} фото"` per row (Russian invariant plural per project convention — simpler than `фото / фотографии / фотографий` rules and matches the existing short-form style elsewhere in the dashboard).
- **`StaffSection` entry point**: added `<Camera>` icon button (aria-label `"Фотографии работ"`) next to the existing delete trash in each staff card. Clicking sets `photosStaff` state, which conditionally mounts the modal. Delete button also got a missing `aria-label` as a minor polish.
- **Dashboard wiring**: added `staffId` to the `photos` select + serialization; threaded `serializedServices` into `<StaffSection>` via a new optional `services` prop.
- **Tests**: ServicePhotoUpload +3 (staffId FormData forward; hide Set-as-cover in staff-scoped mode; cover badge still renders). StaffPhotosModal +5 (counts, empty state, expand mount, collapse-on-other-open, close). Total 201 → 209.
- **Deferred**: staff-scoped reorder (backend limitation documented in AC-006 and inline `TODO(2.6)` in `ServicePhotoUpload.tsx`). Interior photos split to Story 2.5.
- **Manual smoke**: deferred to user — see Task 7 checklist.

### Change Log

- 2026-04-14: Story 2.3 drafted (ready-for-dev). Scope narrowed to staff-scoped upload + delete only; epic AC-004 (interior photos) split out to new Story 2.5. Staff-filtered reorder deferred to follow-up Story 2.6 with rationale captured in AC-006.
- 2026-04-14: Story 2.3 implemented (review). `ServicePhotoUpload` dual-mode + `StaffPhotosModal` + `StaffSection` entry point + dashboard data threading; +8 tests; 209 total; build + lint + typecheck clean.

### File List

- `src/components/dashboard/ServicePhotoUpload.tsx` — modified (added `staffId?` prop + `staffScoped` branch; extracted `renderThumb` helper; staff-scoped strip uses plain `<div>`, hides `Сделать обложкой` button; upload FormData forwards `staffId`; inline `TODO(2.6)` at reorder branch)
- `src/components/dashboard/__tests__/ServicePhotoUpload.test.tsx` — modified (+3 tests in new `staff-scoped mode` describe block; 18 total in file)
- `src/components/dashboard/StaffPhotosModal.tsx` — created (modal shell + collapsible service list + per-service `ServicePhotoUpload` scoped to (serviceId, staffId))
- `src/components/dashboard/__tests__/StaffPhotosModal.test.tsx` — created (5 tests)
- `src/components/dashboard/StaffSection.tsx` — modified (added `services?` prop; new `<Camera>` entry-point button per staff card; modal wiring via `photosStaff` state; minor polish: added missing `aria-label` to delete button; removed unused `Edit`/`Save` imports)
- `src/app/dashboard/page.tsx` — modified (extended `photos` select with `staffId`; extended serialization to forward `staffId`; threaded `serializedServices` into `<StaffSection>`)
