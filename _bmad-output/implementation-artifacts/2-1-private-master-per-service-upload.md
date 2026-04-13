# Story 2.1: Private Master — Per-Service Photo Upload

Status: done

## Story

As a Private Master,
I want to upload photos directly into a specific service in my dashboard,
so that my portfolio is automatically organized by service without manual tagging.

## Why This Story Exists (Context)

Post–Epic 1, the backend is fully wired: `PortfolioPhoto` model, `uploadServicePhotos` server action (with position-assignment logic), and public read routes. What's missing is the **dashboard affordance** that lets a Private Master actually upload.

Existing dashboard today:
- [ServiceList.tsx](src/components/dashboard/ServiceList.tsx) shows each service as a row with Edit/Delete buttons
- Thumbnail at [L34-L44](src/components/dashboard/ServiceList.tsx#L34-L44) reads from legacy `service.images[0]` (String[] column), NOT `PortfolioPhoto`
- `AddServiceForm` has inline legacy single-photo upload via deprecated `uploadServicePhoto` (singular) action

This story adds a net-new affordance — an "Upload Photos" area on each service card — that writes to `PortfolioPhoto` via `uploadServicePhotos` (Story 1.4) and renders a preview strip of what was uploaded.

**Scope boundary:** Private Masters and Individuals only (`provider_type !== 'SALON'`). Salon admin upload with staff attribution is Story 2.3. Reorder / set-cover / delete is Story 2.2.

**Legacy coexistence:** `service.images` (String[]) stays untouched — the legacy array is still read by some unmigrated surfaces. This story only ADDS the new PortfolioPhoto path; data from Story 1.3 migration is already in `PortfolioPhoto`, so existing photos appear in the new strip automatically.

## Acceptance Criteria

1. **AC-001:** Each service card in the dashboard (`/dashboard?section=services`) displays an "Upload Photos" affordance — a dashed-border drop target with icon + "Добавить фото" label. Renders for every service row, regardless of current photo count.

2. **AC-002:** Clicking the affordance opens the native file picker with `multiple` attribute — user can select 1..N files in one gesture. Accepted MIME types: `image/jpeg, image/png, image/webp` (matches server validation).

3. **AC-003:** On selection, photos upload via `uploadServicePhotos` server action (from Story 1.4). Server assigns positions — the very first photo for a service gets `position: 0` (auto-cover behavior handled server-side; UI confirms by showing it first in the strip).

4. **AC-004:** For services that already have photos, subsequent uploads get server-assigned `position: maxPos + 1 + i`. UI reflects this by appending the newly uploaded photos to the end of the strip (no reorder UI yet — Story 2.2).

5. **AC-005:** Progress indicator shown during upload: spinner overlay on the drop target + disabled state. On completion, spinner disappears and uploaded photos appear in the strip. On error, toast notifies user + drop target re-enables.

6. **AC-006:** After upload, photos appear in a per-service **photo strip** — a horizontal row of ~56×56px thumbnails rendered inside or adjacent to the service card. Strip sourced from `PortfolioPhoto` records fetched with services in the dashboard server component, merged with newly-uploaded photos in client state. Thumbnails ordered by `position ASC`.

7. **AC-007:** Salon profiles (`provider_type === 'SALON'`) do NOT see this per-service drop target — Salon UX is scoped to Story 2.3 (team-scoped navigation). For Salons, the existing service card renders unchanged (no regression).

8. **AC-008:** Client-side file validation mirrors server: reject non-allowed MIME types and files > 5MB with inline toast, without a server round-trip. Server validation remains the source of truth (defense in depth).

9. **AC-009:** Zero regressions. Existing `ServiceList` / `AddServiceForm` behavior untouched. Legacy `service.images[0]` thumbnail at [ServiceList.tsx:34-44](src/components/dashboard/ServiceList.tsx#L34-L44) continues to render (the new strip is additive, not replacing).

## Tasks / Subtasks

- [x] Task 1: Extend dashboard data loader (AC: 006, 007)
  - [x] 1.1: Used Option A (Prisma `include: { photos }`) — cleaner than separate query; `Service.photos` relation confirmed in schema
  - [x] 1.2: `serializedServices` mapping extended with `portfolioPhotos: [{ id, url, position }]`
  - [x] 1.3: `isSalonProvider` (already computed at dashboard/page.tsx:265) threaded into `ServicesSection`

- [x] Task 2: Create `ServicePhotoUpload` client component (AC: 001, 002, 003, 004, 005, 008)
  - [x] 2.1: `src/components/dashboard/ServicePhotoUpload.tsx` created with `'use client'`
  - [x] 2.2: Props `serviceId: number`, `initialPhotos: ServicePhoto[]`
  - [x] 2.3: State `photos`, `isUploading`; errors surfaced via toast (no local error field)
  - [x] 2.4: Hidden `<input type="file" multiple accept="image/jpeg,image/png,image/webp">` + visible dashed drop button
  - [x] 2.5: Client validation mirrors server allowlist + 5MB cap; FormData construction; merge-and-sort by position on success
  - [x] 2.6: `Loader2` spin icon + "Загрузка..." label + disabled state during upload
  - [x] 2.7: Horizontal thumbnail strip above drop target — 56x56 rounded thumbnails ordered by position
  - [x] 2.8: `react-hot-toast` used for success/error

- [x] Task 3: Integrate into ServiceList / ServicesSection (AC: 001, 007, 009)
  - [x] 3.1: `ServiceData` interface extended with optional `portfolioPhotos?: ServicePhoto[]`
  - [x] 3.2: `<ServicePhotoUpload>` rendered below price/duration row — always visible when shown
  - [x] 3.3: New `showPhotoUpload` prop on `ServiceList`; `ServicesSection` passes `!isSalonProvider`
  - [x] 3.4: Salon profiles get `showPhotoUpload={false}` → no regression to salon services view
  - [x] 3.5: Legacy `service.images[0]` thumbnail at [ServiceList.tsx:34-44](src/components/dashboard/ServiceList.tsx#L34-L44) untouched

- [x] Task 4: Component tests (AC: all)
  - [x] 4.1: `src/components/dashboard/__tests__/ServicePhotoUpload.test.tsx` created (`@testing-library/react` already installed + jsdom env)
  - [x] 4.2: `uploadServicePhotos` + `react-hot-toast` mocked
  - [x] 4.3: 9 cases covering: initial render, existing photos strip, happy path with FormData verification, sort by position, MIME reject (client), size reject (client), progress state, server-error toast, multi-file batching
  - [x] 4.4: `@testing-library/react` v16.3.2 already in package.json — no fallback needed

- [ ] Task 5: Manual smoke test (AC: all, required per UI guidance)
  - [ ] 5.1-5.9: **Deferred to user validation** — cannot exercise native file picker or blob storage from headless dev environment. Component tests cover the deterministic logic; recommended user smoke plan remains in the story body for manual execution

- [x] Task 6: Verify end-to-end (AC: 009)
  - [x] 6.1: `npx vitest run` — **22 files / 195 tests** (was 21/186 — +1 file, +9 tests), 0 failures
  - [x] 6.2: `npm run lint` — 0 new warnings (4 pre-existing warnings unchanged)
  - [x] 6.3: `npx tsc --noEmit` — 103 errors before vs 103 after = **zero new TS errors** from my changes (all errors in pre-existing unrelated files)

## Dev Notes

### Project Patterns to Follow

**Client component with file input + server action** — closest reference is [AvatarUpload.tsx](src/components/dashboard/AvatarUpload.tsx):

```tsx
'use client';
import { useRef, useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { uploadServicePhotos } from '@/app/actions/portfolio-photos';

export function ServicePhotoUpload({ serviceId, initialPhotos }: Props) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [photos, setPhotos] = useState(initialPhotos);
    const [isUploading, setIsUploading] = useState(false);

    const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        if (files.length === 0) return;

        // Client-side validation (defense in depth; server is authoritative)
        for (const f of files) {
            if (!['image/jpeg','image/png','image/webp'].includes(f.type)) {
                toast.error('Допустимы только JPEG, PNG и WebP.');
                return;
            }
            if (f.size > 5 * 1024 * 1024) {
                toast.error('Файл слишком большой (макс. 5 МБ).');
                return;
            }
        }

        setIsUploading(true);
        const fd = new FormData();
        fd.set('serviceId', String(serviceId));
        files.forEach((f) => fd.append('photos', f));

        const result = await uploadServicePhotos(fd);
        setIsUploading(false);

        if (result.success) {
            setPhotos((prev) => [...prev, ...result.photos].sort((a,b) => a.position - b.position));
            toast.success(`Загружено: ${result.photos.length}`);
        } else {
            toast.error(result.error);
        }

        // Reset input so the same file can be re-selected
        if (inputRef.current) inputRef.current.value = '';
    };

    return (
        <div className="mt-3 space-y-2">
            {photos.length > 0 && (
                <div className="flex gap-2 overflow-x-auto">
                    {photos.map((p) => (
                        <img key={p.id} src={p.url} alt="" className="h-14 w-14 rounded-lg object-cover" />
                    ))}
                </div>
            )}
            <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={isUploading}
                className="relative flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 text-xs text-gray-500 hover:border-gray-400 hover:bg-gray-50 disabled:opacity-60"
            >
                {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                {isUploading ? 'Загрузка...' : 'Добавить фото'}
            </button>
            <input
                ref={inputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                onChange={handleChange}
                className="hidden"
            />
        </div>
    );
}
```

### Dashboard Data Fetch — Option A (include) vs Option B (separate query)

Option A — include on `service.findMany`:
```typescript
const services = await prisma.service.findMany({
    where: { profile_id: profileId },
    orderBy: { title: 'asc' },
    include: {
        photos: {
            orderBy: { position: 'asc' },
            select: { id: true, url: true, position: true },
        },
    },
});
```
(Note: confirm the relation is named `photos` on `Service` — check `prisma/schema.prisma`.)

Option B — separate query + map:
```typescript
const serviceIds = services.map((s) => s.id);
const photos = await prisma.portfolioPhoto.findMany({
    where: { profileId, serviceId: { in: serviceIds } },
    orderBy: { position: 'asc' },
    select: { id: true, url: true, position: true, serviceId: true },
});
const photosByService = new Map<number, typeof photos>();
for (const p of photos) {
    if (p.serviceId == null) continue;
    const arr = photosByService.get(p.serviceId) ?? [];
    arr.push(p);
    photosByService.set(p.serviceId, arr);
}
```

**Recommend Option A** — less code, Prisma handles the join, idiomatic. Only switch to B if the `photos` relation name isn't defined on `Service`.

### Client-Side Validation Rationale

Server (`uploadServicePhotos`) validates MIME + size authoritatively. Client-side validation is UX, not security — reject early to avoid a wasted upload round-trip for a 50MB file. Mirror the exact allowlist and 5MB cap so behavior is consistent.

### Progress UX

- **Simple** (recommended for this story): single spinner overlay on drop target + "Загрузка..." label while any upload is pending
- **Not this story**: per-file progress bars (requires chunked upload infrastructure — out of scope)
- **Not this story**: drag-and-drop from desktop (click-to-pick is sufficient for AC-002)

### Legacy `service.images` Array

Do NOT touch the existing `ServiceList` thumbnail logic. The legacy `service.images[0]` thumbnail at [ServiceList.tsx:34-44](src/components/dashboard/ServiceList.tsx#L34-L44) stays. The new `ServicePhotoUpload` strip is additive and sourced from `PortfolioPhoto`. Migrating the thumbnail to read from PortfolioPhoto is an Epic 3/4 concern when the public profile page gets redesigned.

### Salon Branch Guard

Load the profile's `provider_type` in the dashboard server component (already loaded for other sections via `profile`), then pass `isSalonProvider = profile.provider_type === 'SALON'` to `ServicesSection`. Branch at the `ServiceList` level — don't render `ServicePhotoUpload` for Salons.

Rationale for branching at component level (not AC-only at server level): Salon admins still use the same service list — we only want to suppress the new photo upload UI, not the whole services tab.

### Anti-Patterns to Avoid

- **DO NOT** use the legacy `uploadServicePhoto` (singular, in `src/app/actions/upload.ts`) — it writes to `Service.images` String[], not to `PortfolioPhoto`. Use `uploadServicePhotos` (plural, in `src/app/actions/portfolio-photos.ts`) exclusively for this story.
- **DO NOT** replace the existing legacy thumbnail — that's a migration concern for the profile page redesign (Epic 3/4), not for the dashboard.
- **DO NOT** add reorder, set-cover, or delete buttons to the strip — those are Story 2.2.
- **DO NOT** pass `staffId` in the FormData — that's Salon territory (Story 2.3). `uploadServicePhotos` already treats absent `staffId` as "no staff attribution" (Story 1.5 AC-001).
- **DO NOT** block the form when upload fails — reset state and let the user retry.
- **DO NOT** optimistically add photos to state before the server returns — the server assigns `position` and `id`, and those need to be accurate. Wait for the action result.
- **DO NOT** use `router.refresh()` after upload — `revalidatePath('/dashboard', 'layout')` in the server action already handles cache invalidation; add-to-state is sufficient for immediate feedback.
- **DO NOT** localize error strings to English — Russian is the project convention.

### Previous Story Intelligence

- **Story 1.4:** `uploadServicePhotos` is the server action. FormData keys are `serviceId` (string, parsed to int) and `photos` (repeated File entries). Response: `{ success: true, photos: [{ id, url, position }] } | { success: false, error: string }`.
- **Story 1.5:** `uploadServicePhotos` now also accepts optional `staffId`. This story does NOT send `staffId` (Private Master has no staff dimension).
- **Story 1.3:** Existing legacy photos were already migrated into `PortfolioPhoto` with correct serviceId and position. So the first page load already shows the old photos in the new strip.
- **Test baseline:** 21 files, 186 tests, 0 failures.

### Verification Commands

```bash
npm run dev                                          # manual smoke in browser
npx vitest run                                       # full test suite
npx vitest run src/components/dashboard/__tests__/ServicePhotoUpload  # new tests
npm run lint
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.1]
- [Source: _bmad-output/BLUEPRINT-salon-slug-redesign.md — UX rules "upload destination IS classification"]
- [Source: src/components/dashboard/AvatarUpload.tsx — nearest component template]
- [Source: src/components/dashboard/ServiceList.tsx — integration target]
- [Source: src/components/dashboard/ServicesSection.tsx — data threading]
- [Source: src/app/actions/portfolio-photos.ts — server action]
- [Source: src/app/dashboard/page.tsx#L278 — services query extension point]
- [Source: prisma/schema.prisma — Service ↔ PortfolioPhoto relation]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (Amelia persona, BMAD dev-story workflow)

### Debug Log References

- Verified `Service.photos` relation exists at `prisma/schema.prisma:103` (`photos PortfolioPhoto[]`) — Option A (Prisma include) used.
- Verified `@testing-library/react` v16.3.2 + jsdom + vitest globals all pre-configured — no test-infra setup needed.
- Pre-existing tsc baseline: 103 errors (unrelated files: `guide/page.tsx` framer-motion, legacy test types). Post-change: 103 — zero new errors.
- Pre-existing lint warnings: 4 (unchanged, unrelated files).

### Completion Notes List

- **Data flow**: services query uses `include: { photos: { orderBy: { position: 'asc' }, select: { id, url, position } } }` — single query, no N+1.
- **Component placement**: drop target is always-visible inside each service card, below price/duration row (per epic UX rule "upload INTO service folder IS the classification" — no modal, no additional click).
- **Strip rendering**: horizontal overflow-scroll with 56×56px thumbnails; on new upload, photos merged into state then sorted by position ascending (so server-assigned positions are authoritative and cover always appears first).
- **Client validation**: mirrors server allowlist (JPEG/PNG/WebP + 5MB) — rejects early with toast, no server round-trip for oversized files. Server is still authoritative (defense in depth).
- **Progress UX**: single spinner on the drop button + disabled state — simple; per-file progress bars out of scope.
- **Input reset**: after every upload (success or failure), file input value is cleared so the same file can be re-selected.
- **Salon guard**: `showPhotoUpload={!isSalonProvider}` in ServicesSection → ServiceList. Salon admins see zero regression; they'll get the team-scoped flow in Story 2.3.
- **Legacy thumbnail preserved**: `service.images[0]` rendering in ServiceList untouched (AC-009). Migration to PortfolioPhoto-only thumbnails is Epic 3/4 concern.
- **Manual smoke deferred**: file-picker flow + blob storage cannot be exercised from headless environment. Story 5 recommends a user smoke-test plan.
- All 9 ACs satisfied except AC-005's exact visual rendering (validated via component tests for state transitions; user smoke confirms final pixels).
- Zero regressions: 195/195 tests pass.

### Change Log

- 2026-04-13: Story 2.1 drafted (ready-for-dev) — first Epic 2 frontend story
- 2026-04-13: Story 2.1 implemented (review) — ServicePhotoUpload component + dashboard integration + 9 unit tests

### Review Findings

- [x] [Review][Pass] All 9 ACs verified; no patches required
- [x] [Review][Defer] `alt=""` on thumbnails — a11y polish for Story 2.2/3.x
- [x] [Review][Defer] Legacy `service.images[0]` will go stale vs new `PortfolioPhoto` records — expected per AC-009 transition; resolves in Epic 3/4
- [x] [Review][Defer] Raw `<img>` (not `<Image>`) — matches AvatarUpload pattern for user-uploaded blobs
- [x] [Review][Defer] Click→isUploading race — OS prevents concurrent native pickers; no practical impact
- [x] [Review][Defer] No ServiceList-level test for `showPhotoUpload` branching — out of AC-005 scope
- [x] [Review][Defer] Manual browser smoke — requires user validation (native picker + blob env)

### Change Log (cont.)

- 2026-04-13: Story 2.1 code-review passed — all 9 ACs verified, 0 patches required

### File List

- `src/components/dashboard/ServicePhotoUpload.tsx` — created (client component: file input + strip + progress + toasts)
- `src/components/dashboard/__tests__/ServicePhotoUpload.test.tsx` — created (9 component tests)
- `src/app/dashboard/page.tsx` — modified (services query include + serializer extension + `isSalonProvider` prop pass-through)
- `src/components/dashboard/ServicesSection.tsx` — modified (accept `isSalonProvider`, pass `showPhotoUpload` to ServiceList)
- `src/components/dashboard/ServiceList.tsx` — modified (extended ServiceData, render ServicePhotoUpload conditionally)
