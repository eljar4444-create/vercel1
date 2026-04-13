# Story 1.4: API Endpoints — PortfolioPhoto CRUD + Queries

Status: done

## Story

As a developer,
I want server-side endpoints for photo upload, reorder, deletion, and query by profile/service/staff,
so that the dashboard and profile page can use the new PortfolioPhoto model.

## Architectural Reconciliation (READ FIRST)

The epic was written with REST-style endpoint paths. This project uses **Next.js Server Actions for all dashboard writes** and **API routes for public/session reads** (see `src/app/actions/services.ts`, `src/app/api/me/provider-profile/route.ts`). Story 1.4 deliverables translate as follows:

| Epic AC | Project-aligned delivery | File |
|---|---|---|
| AC-001 upload | Server Action `uploadServicePhotos` | `src/app/actions/portfolio-photos.ts` |
| AC-002 reorder | Server Action `reorderServicePhotos` | same |
| AC-003 delete | Server Action `deletePortfolioPhoto` | same |
| AC-004 craft wall (public) | API route `/api/salon/[slug]/photos/route.ts` | new |
| AC-005 service photos (public) | same route, `?serviceId=X` query | same |
| AC-006 staff photos (public) | same route, `?staffId=Y` query | same |
| AC-007 arrival info (session-auth) | API route `/api/bookings/[id]/arrival/route.ts` | new |
| AC-008 error codes + validation | Applied across all deliverables | — |

Rationale: matches existing pattern (`src/app/actions/upload.ts:uploadServicePhoto`, `src/app/actions/services.ts:deleteService`). Public reads correctly use API routes for cacheability.

## Acceptance Criteria

1. **AC-001:** `uploadServicePhotos(formData: FormData)` server action — accepts `serviceId` + 1..N `photo` files. Creates `PortfolioPhoto` records for the service. Assigns `position = max(position) + 1 + i` per file (first photo for a service with no existing photos gets `position: 0` = cover). Validates MIME (`image/jpeg|png|webp`) and 5MB size limit. Returns `{ success: true, photos: [{id, url, position}] } | { success: false, error }`. Ownership-verified (profile owner OR admin).

2. **AC-002:** `reorderServicePhotos(serviceId: number, photoIdOrder: string[])` server action — reassigns `position` values (0..N-1) based on the order of photo IDs provided. Validates that every ID belongs to that service. First ID becomes cover (`position: 0`). Returns `{ success: true } | { success: false, error }`. Ownership-verified.

3. **AC-003:** `deletePortfolioPhoto(photoId: string)` server action — deletes a single photo. Ownership-verified (photo's `profileId` → owner OR admin). Does NOT re-pack positions (caller reorders if needed). Returns `{ success: true } | { success: false, error }`.

4. **AC-004:** `GET /api/salon/[slug]/photos` — returns all photos for a published+verified profile, shuffled server-side. **Public** — applies `getPublicProfileFilters()` so photos from DRAFT/PENDING/SUSPENDED profiles are never leaked. Supports `?limit=N&cursor=ID` pagination (default limit 60, max 200). Response: `{ photos: [{id, url, serviceId, staffId, position}], nextCursor: string | null }`.

5. **AC-005:** `GET /api/salon/[slug]/photos?serviceId=X` — photos filtered to that service, ordered by `position ASC`. Public (same visibility gate as AC-004). Returns `{ photos: [...] }` (no pagination needed — per-service photo counts are small).

6. **AC-006:** `GET /api/salon/[slug]/photos?staffId=Y` — photos filtered to that specialist on that profile, ordered by `position ASC`. Public. Validates that `staffId` belongs to the profile (else 404). Returns `{ photos: [...] }`.

7. **AC-007:** `GET /api/bookings/[id]/arrival` — returns `Profile.arrivalInfo` JSON only when: (a) caller is the booking's client user (`session.user.id === booking.user_id`), (b) booking status is `confirmed`, AND (c) provider profile `provider_type !== 'SALON'`. All other cases → 403. Missing booking → 404. Missing `arrivalInfo` → 200 with `{ arrivalInfo: null }`. Response: `{ arrivalInfo: { address, doorCode?, bellNote?, waitingSpot? } | null }`.

8. **AC-008:** All deliverables return correct HTTP status codes for API routes (200, 400, 401, 403, 404) and structured error objects for server actions (`{ success: false, error: '<russian message>' }`). All input validated (type, bounds, ownership). No endpoint exposes a 500 stack trace.

## Tasks / Subtasks

- [x] Task 1: Create server actions file (AC: 001, 002, 003)
  - [x] 1.1: Created `src/app/actions/portfolio-photos.ts` with `'use server'` directive
  - [x] 1.2: `uploadServicePhotos` — MIME/size per file, owner or admin check, maxPos+1+i position, `$transaction` create
  - [x] 1.3: `reorderServicePhotos` — service-scoped validation, duplicate/incomplete/invalid rejection, atomic transaction
  - [x] 1.4: `deletePortfolioPhoto` — ownership via photo's profile (user_id OR email); admin bypass
  - [x] 1.5: All three call `revalidatePath('/dashboard', 'layout')` — dashboard revalidation; /salon/[slug] revalidation deferred to page layout story (no consumer yet)

- [x] Task 2: Create public photos API route (AC: 004, 005, 006)
  - [x] 2.1: Created `src/app/api/salon/[slug]/photos/route.ts` with `GET` handler
  - [x] 2.2: `getPublicProfileFilters()` applied — DRAFT/PENDING/SUSPENDED/banned/health profiles return 404
  - [x] 2.3: Query branching: no-filter → craft wall (RANDOM()); `serviceId` → `position ASC`; `staffId` → 404 if staff not on profile, else `position ASC`
  - [x] 2.4: `limit` default 60, max 200, rejects ≤0 with 400; non-numeric `serviceId` → 400
  - [x] 2.5: Server-side `$queryRaw` with `ORDER BY RANDOM()`; cursor pagination deferred (documented inline)

- [x] Task 3: Create arrival info API route (AC: 007)
  - [x] 3.1: Created `src/app/api/bookings/[id]/arrival/route.ts` with `GET` handler
  - [x] 3.2: 401 when no session; 400 when id is non-numeric
  - [x] 3.3: Booking loaded with `profile: { select: { provider_type, arrivalInfo } }`
  - [x] 3.4: Three gates enforced: `booking.user_id === session.user.id` AND `status === 'confirmed'` AND `provider_type !== 'SALON'`
  - [x] 3.5: Returns `{ arrivalInfo }` (or `null`) on pass; 403 on any gate fail; 404 when booking missing

- [x] Task 4: Input validation (AC: 008)
  - [x] 4.1: MIME allowlist + 5MB cap mirrors `src/app/actions/upload.ts`
  - [x] 4.2: Reorder rejects empty/duplicate/incomplete/invalid ID sets
  - [x] 4.3: API routes return 400 for malformed params

- [x] Task 5: Unit tests (AC: all)
  - [x] 5.1: `src/app/actions/__tests__/portfolio-photos.test.ts` follows `uploadAvatar.test.ts` mocking pattern
  - [x] 5.2: Happy paths: upload with maxPos logic, upload first photo at position 0, reorder, delete
  - [x] 5.3: Attack mitigation: unauthenticated/banned rejection, cross-profile upload/reorder rejection, non-owner delete rejection, admin bypass for delete
  - [x] 5.4: Validation: wrong MIME, >5MB, empty/duplicate reorder IDs, non-existent photo
  - [x] 5.5: `src/app/api/__tests__/salon-photos.test.ts` + `src/app/api/__tests__/bookings-arrival.test.ts` created
  - [x] 5.6: API route tests: visibility gate 404, invalid limit/serviceId, staff not on profile 404, all 3 arrival gates

- [x] Task 6: Verify end-to-end (AC: all)
  - [x] 6.1: Full test suite: **20 files, 171 tests** (was 17/139 — +3 files, +32 tests)
  - [x] 6.2: Manual smoke deferred to dashboard integration (Epic 2) — endpoints verified via unit tests
  - [x] 6.3: Zero regressions against baseline

## Dev Notes

### Project Patterns to Follow

**Server action template** (from `src/app/actions/services.ts:createService`):
```typescript
'use server';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { requireProviderProfile } from '@/lib/auth-helpers';

export async function uploadServicePhotos(formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: 'Требуется авторизация.' };
    if (session.user.isBanned) return { success: false, error: 'Ваш аккаунт заблокирован.' };

    try {
        const profile = await requireProviderProfile(session.user.id, session.user.email);
        // ... validation, ownership, mutation ...
        revalidatePath('/dashboard', 'layout');
        return { success: true, photos };
    } catch (error: any) {
        console.error('uploadServicePhotos error:', error);
        return { success: false, error: error?.message || 'Ошибка загрузки.' };
    }
}
```

**Upload mechanics** — reuse `savePublicUpload` from `src/lib/server/public-upload.ts`:
```typescript
const { url } = await savePublicUpload(file, {
    blobFolder: 'portfolio',        // new folder for PortfolioPhoto uploads
    localFolder: 'uploads/portfolio',
    filenamePrefix: session.user.id,
    fallbackName: 'portfolio-photo.jpg',
});
```

**Auth + ownership pattern** (from `src/app/actions/services.ts:deleteService`):
```typescript
const photo = await prisma.portfolioPhoto.findUnique({
    where: { id: photoId },
    select: { profile: { select: { user_id: true, user_email: true } } },
});
if (!photo) return { success: false, error: 'Фото не найдено.' };
if (session.user.role !== 'ADMIN') {
    const ownsByUserId = photo.profile.user_id === session.user.id;
    const ownsByEmail = session.user.email && photo.profile.user_email === session.user.email;
    if (!ownsByUserId && !ownsByEmail) return { success: false, error: 'Недостаточно прав.' };
}
```

**Public visibility gate** — the photos API MUST apply `getPublicProfileFilters()`:
```typescript
import { getPublicProfileFilters } from '@/lib/publicQueryFilters';

const profile = await prisma.profile.findFirst({
    where: {
        AND: [
            { slug: params.slug },
            ...getPublicProfileFilters(),
        ],
    },
    select: { id: true },
});
if (!profile) return NextResponse.json({ error: 'Not found' }, { status: 404 });
```
This guards against leaking photos from DRAFT, PENDING_REVIEW, SUSPENDED, banned-owner, or `health` category profiles.

### Position Assignment Algorithm (AC-001)

For multi-photo upload of N files:
1. `const existing = await prisma.portfolioPhoto.findMany({ where: { profileId, serviceId }, select: { position: true } })`
2. `const maxPos = existing.length === 0 ? -1 : Math.max(...existing.map(p => p.position))`
3. Each new photo gets `position = maxPos + 1 + i` where `i` is its index in the upload batch
4. If `existing.length === 0`, first photo gets `position: 0` (auto-cover)

Use `prisma.$transaction([...creates])` for atomicity.

### Reorder Algorithm (AC-002)

```typescript
const photos = await prisma.portfolioPhoto.findMany({
    where: { serviceId, profileId: profile.id },
    select: { id: true },
});
const validIds = new Set(photos.map(p => p.id));
if (photoIdOrder.length !== validIds.size) return { success: false, error: 'Неполный список фото.' };
if (photoIdOrder.some(id => !validIds.has(id))) return { success: false, error: 'Недопустимый id фото.' };
if (new Set(photoIdOrder).size !== photoIdOrder.length) return { success: false, error: 'Дубликаты в порядке.' };

await prisma.$transaction(
    photoIdOrder.map((id, position) =>
        prisma.portfolioPhoto.update({ where: { id }, data: { position } })
    )
);
```

### Craft Wall Shuffle Strategy (AC-004)

**Decision: server-side random via Postgres `ORDER BY RANDOM()` for limit ≤ 200.**

Rationale:
- Simple implementation; no memory pressure at this scale
- For a profile with ≤ 200 photos (realistic upper bound), `RANDOM()` is cheap
- Cursor pagination with shuffle is a known hard problem; at our scale, limit=60 returns everything typical users have. If profiles exceed 200 photos, Story 4.1 can introduce deterministic seeded shuffle later

Implementation:
```typescript
const photos = await prisma.$queryRaw`
    SELECT id, url, "serviceId", "staffId", position
    FROM "PortfolioPhoto"
    WHERE "profileId" = ${profile.id}
    ORDER BY RANDOM()
    LIMIT ${limit}
`;
```

Cursor pagination is **out of scope** for this story — if AC-004 mentions `cursor`, skip it and return `nextCursor: null`. Document this deferral in completion notes.

### Arrival Info Gate (AC-007)

All three conditions MUST pass, else 403:
1. `session.user.id === booking.user_id` (client is the caller)
2. `booking.status === 'confirmed'` (NOT 'pending', 'cancelled', etc.)
3. `booking.profile.provider_type !== 'SALON'` (Salons don't have arrivalInfo)

Status enum values currently used (from `prisma/schema.prisma:118`): `status String @default("pending")` — so `'confirmed'` is the published/accepted state. Check `src/lib/services/booking/availability.ts` or booking actions for the canonical string.

### Test Mocking Pattern (from `uploadAvatar.test.ts`)

```typescript
vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
    default: { portfolioPhoto: { findMany: vi.fn(), create: vi.fn(), ... } }
}));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/server/public-upload', () => ({
    savePublicUpload: vi.fn().mockResolvedValue({ url: 'http://example.com/x.jpg' }),
}));
```

### Previous Story Intelligence

- **Story 1.1:** PortfolioPhoto model uses cuid IDs (String), has indexes on `profileId`, `serviceId`, `staffId`, and composite `(profileId, serviceId)`. Cascade delete from Profile. SetNull from Service and Staff. `updatedAt` field is `@updatedAt` (Prisma auto-manages).
- **Story 1.2:** `Profile.arrivalInfo` is `Json?`. Structure documented in schema comment.
- **Story 1.3:** Some photos have `position: 10000+` (studio interior photos). This is RELEVANT for AC-004 craft wall shuffle — they're included; for AC-005 service photos — they won't match (no serviceId); for AC-006 staff photos — they won't match (no staffId). Behavior is correct without special handling.
- **Test baseline:** 17 files, 139 tests, 0 failures.

### Anti-Patterns to Avoid

- **DO NOT** create REST-style API routes under `/api/dashboard/...` — the project uses Server Actions for dashboard writes. Only create API routes for public reads + session-scoped reads.
- **DO NOT** forget the public visibility gate on `/api/salon/[slug]/photos` — leaking photos from DRAFT profiles is a privacy hole.
- **DO NOT** expose `Profile.arrivalInfo` on ANY public endpoint — it's session-scoped, booking-scoped, and provider-type-scoped. Three gates.
- **DO NOT** use `createMany` for upload — single `$transaction` with individual `create` calls preserves FK validation and returns created records.
- **DO NOT** re-pack positions after delete — callers handle reorder separately (keeps the action atomic and predictable).
- **DO NOT** allow admins to bypass the public visibility gate on the public photos endpoint — admin privilege applies only to writes, not to public read privacy.
- **DO NOT** localize error strings to English — project convention is Russian user-facing messages (see all action files).
- **DO NOT** introduce new auth libraries — use existing `auth()` from `@/auth` and `requireProviderProfile` from `@/lib/auth-helpers`.

### Verification Commands

```bash
npx vitest run                                                # all tests
npx vitest run src/app/actions/__tests__/portfolio-photos    # new action tests
npx vitest run src/app/api/__tests__/salon-photos            # new API tests
npm run lint                                                  # ensure type/lint clean
npx prisma validate                                           # schema sanity
```

### References

- [Source: _bmad-output/BLUEPRINT-salon-slug-redesign.md#§7 — API Endpoints]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.4]
- [Source: src/app/actions/services.ts — server action pattern]
- [Source: src/app/actions/upload.ts — file upload pattern]
- [Source: src/lib/auth-helpers.ts — requireProviderProfile]
- [Source: src/lib/publicQueryFilters.ts — public visibility gate]
- [Source: src/lib/server/public-upload.ts — savePublicUpload]
- [Source: src/app/actions/__tests__/uploadAvatar.test.ts — test pattern]
- [Source: prisma/schema.prisma — PortfolioPhoto, Booking, Profile.arrivalInfo]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (Amelia persona, BMAD dev-story workflow)

### Debug Log References

- Confirmed Booking.status uses string literal `'confirmed'` (not enum) by grepping existing usage in `src/app/actions/booking.ts`, `src/components/chat/MessengerClient.tsx`, etc.
- Test baseline was 17 files / 139 tests — after this story it's 20 files / 171 tests.

### Completion Notes List

- Three server actions in `src/app/actions/portfolio-photos.ts`: `uploadServicePhotos`, `reorderServicePhotos`, `deletePortfolioPhoto`
- Two API routes: `src/app/api/salon/[slug]/photos/route.ts` (public, visibility-gated) and `src/app/api/bookings/[id]/arrival/route.ts` (session + 3-gate)
- Three test files with 32 new tests total — all pass
- **Architectural reconciliation honored**: writes as server actions, public/session reads as API routes — matches existing project pattern
- Public visibility gate applied via `getPublicProfileFilters()` — DRAFT/PENDING_REVIEW/SUSPENDED/banned-owner/health profiles return 404
- Craft wall uses `$queryRaw` with `ORDER BY RANDOM()` (PostgreSQL-specific); cursor pagination explicitly deferred with inline comment
- Arrival info 3-gate check returns 403 for any of: non-client caller, non-confirmed booking, SALON provider
- Russian user-facing error messages throughout (project convention)
- All 8 ACs satisfied
- Zero regressions

### Change Log

- 2026-04-12: Story 1.4 implemented — portfolio photo actions + public/session API routes + 32 unit tests
- 2026-04-12: Code review passed — all 8 ACs verified, no patches required

### Review Findings

- [x] [Review][Defer] Blob storage orphans on failed mid-batch upload — matches existing `uploadServicePhoto` pattern
- [x] [Review][Defer] No blob cleanup on photo delete — matches existing `deleteService` pattern
- [x] [Review][Defer] Combined `?serviceId=X&staffId=Y` query: serviceId wins; not tested, not in ACs
- [x] [Review][Defer] No rate limiting on upload action — project convention rate-limits auth flows only
- [x] [Review][Defer] Concurrent upload race → duplicate positions (sort-order only, not correctness)
- [x] [Review][Defer] `isBanned` not checked on arrival endpoint — matches `/api/me/provider-profile` pattern

### File List

- `src/app/actions/portfolio-photos.ts` — created (upload, reorder, delete server actions)
- `src/app/api/salon/[slug]/photos/route.ts` — created (public photos API with visibility gate)
- `src/app/api/bookings/[id]/arrival/route.ts` — created (session + 3-gate arrival info)
- `src/app/actions/__tests__/portfolio-photos.test.ts` — created (17 tests)
- `src/app/api/__tests__/salon-photos.test.ts` — created (7 tests)
- `src/app/api/__tests__/bookings-arrival.test.ts` — created (8 tests)
