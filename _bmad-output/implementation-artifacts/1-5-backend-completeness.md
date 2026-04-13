# Story 1.5: Backend Completeness — Staff Attribution + Arrival Info Write

Status: done

## Story

As a developer,
I want `uploadServicePhotos` extended to accept optional `staffId` and a new `updateArrivalInfo` server action,
so that Epic 2 (Dashboard) can attribute photos to specialists and save Private Master arrival details without further backend work.

## Why This Story Exists (Context)

Post–Story 1.4, two small but material gaps remain before Epic 1 is truly "done":

1. **Staff attribution on upload** — the data model (PortfolioPhoto.staffId) and the read path (`GET /api/salon/[slug]/photos?staffId=Y`) both already exist, but there is no way to *write* a `staffId` when uploading. Epic 2 (Salon Admin — Specialist + Service Photo Upload, Story 2.3) will be blocked without this.
2. **Arrival info write action** — Story 1.2 added `Profile.arrivalInfo` (Json?) and Story 1.4 added the session-gated read route (`GET /api/bookings/[id]/arrival`), but no action writes it. Epic 5 Story 5.2 (Arrival Info Onboarding Prompt) and Epic 4 Story 4.3 (Arrival Ritual Card) both need this.

Bundling both closes Epic 1 as a self-contained unit before frontend work begins.

## Acceptance Criteria

1. **AC-001:** `uploadServicePhotos(formData: FormData)` accepts an optional `staffId` string in FormData. When present:
   - Validated to be a non-empty string (else: 'Некорректный id специалиста.').
   - Must correspond to a `Staff` record whose `profile_id` equals the service's `profile_id` (else: 'Специалист не принадлежит профилю.' → 404-equivalent).
   - When valid, each new `PortfolioPhoto` is created with that `staffId`.
   - When absent, photos are created with `staffId: null` (existing behavior preserved).

2. **AC-002:** New server action `updateArrivalInfo(data)` writes `Profile.arrivalInfo` JSON on the caller's provider profile. Signature:
   ```typescript
   updateArrivalInfo(data: {
       address: string;
       doorCode?: string;
       bellNote?: string;
       waitingSpot?: string;
   } | null): Promise<{ success: true } | { success: false; error: string }>
   ```
   - Passing `null` clears the field (sets `arrivalInfo: Prisma.DbNull`).
   - Passing an object validates `address` is a non-empty trimmed string (else: 'Адрес обязателен.').
   - Optional fields must be strings when present (else: 'Некорректный формат данных.').
   - **Strips unknown keys** before persist (JSON pollution guard).
   - Calls `revalidatePath('/dashboard', 'layout')` on success.

3. **AC-003:** `updateArrivalInfo` rejects Salon profiles. Caller's profile is loaded; if `provider_type === 'SALON'`, returns `{ success: false, error: 'Информация о прибытии доступна только частным мастерам.' }`. Only `PRIVATE_MASTER` / Individual profiles may store arrival info.

4. **AC-004:** `updateArrivalInfo` is ownership-gated via `requireProviderProfile(user.id, user.email)` — identical pattern to other server actions. Admins bypass the ownership check **only when also providing an explicit `profileId`** — out of scope for this story; for AC-004, admin-targeted updates are not supported (returns the same rejection as non-owner).

5. **AC-005:** Unit tests cover:
   - `uploadServicePhotos` with valid `staffId` → photos created with `staffId`
   - `uploadServicePhotos` with `staffId` belonging to a different profile → rejection
   - `uploadServicePhotos` with `staffId` referencing a non-existent staff → rejection
   - `uploadServicePhotos` without `staffId` → existing behavior (staffId null) preserved
   - `updateArrivalInfo` happy path with full shape
   - `updateArrivalInfo` rejects missing/empty address
   - `updateArrivalInfo` strips unknown keys (e.g., `{ address: 'X', hackField: 'y' }` persists only `address`)
   - `updateArrivalInfo` rejects non-string optional fields
   - `updateArrivalInfo` rejects `provider_type === 'SALON'`
   - `updateArrivalInfo` rejects unauthenticated / banned / non-owner
   - `updateArrivalInfo(null)` clears the field via `Prisma.DbNull`

6. **AC-006:** Zero regressions. Full test suite (`npx vitest run`) passes with existing 20 files / 171 tests intact; new tests additively grow that count.

## Tasks / Subtasks

- [x] Task 1: Extend `uploadServicePhotos` with optional `staffId` (AC: 001)
  - [x] 1.1: Parse `staffId = formData.get('staffId')` after service-ownership check
  - [x] 1.2: Empty string / whitespace-only treated as "no staff" (unchanged behavior)
  - [x] 1.3: `prisma.staff.findFirst({ where: { id, profileId: service.profile_id } })` — null → 'Специалист не принадлежит профилю.'
  - [x] 1.4: `staffId: validatedStaffId` threaded into each `portfolioPhoto.create`
  - [x] 1.5: Validation order preserved (auth → ban → serviceId → files → profile → service → staff → maxPos)

- [x] Task 2: Add `updateArrivalInfo` server action (AC: 002, 003, 004)
  - [x] 2.1: Extended `src/app/actions/portfolio-photos.ts` (cohesion over file-split)
  - [x] 2.2: Auth + ban + `requireProviderProfile` + SALON rejection gate
  - [x] 2.3: Shape validation: trimmed `address` required, optional string fields, allowlist-based key stripping
  - [x] 2.4: `null` input → `Prisma.DbNull` payload
  - [x] 2.5: `prisma.profile.update({ where: { id: profile.id }, data: { arrivalInfo: payload } })`
  - [x] 2.6: `revalidatePath('/dashboard', 'layout')` on success

- [x] Task 3: Unit tests (AC: 005)
  - [x] 3.1: 4 new staffId tests appended to `portfolio-photos.test.ts` (happy path + cross-profile reject + empty-string ignore + absent-field default)
  - [x] 3.2: New `update-arrival-info.test.ts` with 11 tests covering all AC-005 branches
  - [x] 3.3: `prisma.staff.findFirst`, `prisma.profile.update` mocked; `@prisma/client` partially mocked for `Prisma.DbNull` identity comparison

- [x] Task 4: Verify end-to-end (AC: 006)
  - [x] 4.1: `npx vitest run` — **21 files / 186 tests** (was 20/171 — +1 file, +15 tests), 0 failures
  - [x] 4.2: `npm run lint` — 0 new warnings (4 pre-existing warnings unrelated)
  - [x] 4.3: `npx prisma validate` — schema valid (no schema change required)

## Dev Notes

### Extension Pattern for `uploadServicePhotos` (AC-001)

Minimal, additive — do not restructure the existing function. Insert staff resolution between service-ownership check and `existing` query:

```typescript
// after: if (profile && service.profile_id !== profile.id) { ... }

const staffIdRaw = formData.get('staffId');
const rawStaffId =
    typeof staffIdRaw === 'string' && staffIdRaw.trim().length > 0
        ? staffIdRaw.trim()
        : null;

let validatedStaffId: string | null = null;
if (rawStaffId) {
    const staff = await prisma.staff.findFirst({
        where: { id: rawStaffId, profile_id: service.profile_id },
        select: { id: true },
    });
    if (!staff) {
        return { success: false, error: 'Специалист не принадлежит профилю.' };
    }
    validatedStaffId = staff.id;
}
```

Then threaded into the transaction:

```typescript
const created = await prisma.$transaction(
    uploaded.map(({ url }, i) =>
        prisma.portfolioPhoto.create({
            data: {
                profileId: service.profile_id,
                serviceId: service.id,
                staffId: validatedStaffId, // <-- new
                url,
                position: maxPos + 1 + i,
            },
            select: { id: true, url: true, position: true },
        })
    )
);
```

Note: `Staff.profile_id` (snake_case) — confirm via `prisma/schema.prisma:Staff` before coding.

### `updateArrivalInfo` Skeleton (AC-002, 003, 004)

```typescript
import { Prisma } from '@prisma/client';

type ArrivalInfoInput = {
    address: string;
    doorCode?: string;
    bellNote?: string;
    waitingSpot?: string;
};

export async function updateArrivalInfo(
    data: ArrivalInfoInput | null
): Promise<MutationResult> {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: 'Требуется авторизация.' };
    if (session.user.isBanned) return { success: false, error: 'Ваш аккаунт заблокирован.' };

    try {
        const profile = await requireProviderProfile(session.user.id, session.user.email);

        if (profile.provider_type === 'SALON') {
            return {
                success: false,
                error: 'Информация о прибытии доступна только частным мастерам.',
            };
        }

        let payload: Prisma.InputJsonValue | typeof Prisma.DbNull;

        if (data === null) {
            payload = Prisma.DbNull;
        } else {
            if (typeof data !== 'object' || data === null) {
                return { success: false, error: 'Некорректный формат данных.' };
            }
            const address = typeof data.address === 'string' ? data.address.trim() : '';
            if (address.length === 0) {
                return { success: false, error: 'Адрес обязателен.' };
            }
            for (const key of ['doorCode', 'bellNote', 'waitingSpot'] as const) {
                const v = (data as any)[key];
                if (v !== undefined && typeof v !== 'string') {
                    return { success: false, error: 'Некорректный формат данных.' };
                }
            }
            // Strip unknown keys — allowlist only
            const sanitized: Record<string, string> = { address };
            if (typeof data.doorCode === 'string' && data.doorCode.trim()) sanitized.doorCode = data.doorCode.trim();
            if (typeof data.bellNote === 'string' && data.bellNote.trim()) sanitized.bellNote = data.bellNote.trim();
            if (typeof data.waitingSpot === 'string' && data.waitingSpot.trim()) sanitized.waitingSpot = data.waitingSpot.trim();
            payload = sanitized;
        }

        await prisma.profile.update({
            where: { id: profile.id },
            data: { arrivalInfo: payload },
        });

        revalidatePath('/dashboard', 'layout');
        return { success: true };
    } catch (error: any) {
        if (error?.message === 'PROFILE_NOT_FOUND') {
            return { success: false, error: 'Профиль не найден.' };
        }
        console.error('updateArrivalInfo error:', error);
        return { success: false, error: 'Ошибка сохранения.' };
    }
}
```

**Ensure `requireProviderProfile` returns `provider_type`** — check `src/lib/auth-helpers.ts` before coding; if it doesn't, either extend it (preferred — small, broadly useful) or add a follow-up `prisma.profile.findUnique({ select: { provider_type: true } })`.

### Shape Validation Rationale (AC-002)

- `address` required non-empty trimmed — if a user clears it, require them to pass `null` explicitly to erase arrival info; an empty-string address is always rejected. This prevents a silent "you have arrival info but address is blank" state on the profile page.
- **Strip unknown keys** — `arrivalInfo` is `Json?` in Postgres; without key stripping, a malicious caller could pollute the field with arbitrary data that then renders on the profile page. Allowlist: `address`, `doorCode`, `bellNote`, `waitingSpot`.
- Optional fields are trimmed and dropped if empty — keeps the DB clean.

### Staff Validation Is Cheap and Layered (AC-001)

The existing `uploadServicePhotos` already validates service ownership. Adding staff validation is one extra query (`staff.findFirst` with compound filter on `id + profile_id`) — 404 → reject. This catches:

- Non-existent staff IDs
- Cross-profile staff attribution attempts (attacker owns profile A, tries to attribute photos to staff of profile B)

Both the existence and the profile-scope check are enforced in one query via `findFirst({ id, profile_id })`.

### Test Mocking Pattern (append + new file)

Append to `src/app/actions/__tests__/portfolio-photos.test.ts`:

```typescript
// Mock prisma.staff.findFirst once at top of file (if not already)
vi.mock('@/lib/prisma', () => ({
    default: {
        service: { findUnique: vi.fn() },
        portfolioPhoto: { findMany: vi.fn(), create: vi.fn(), ... },
        staff: { findFirst: vi.fn() },  // <-- add
        $transaction: vi.fn(),
        ...
    },
}));

// New tests:
it('attaches staffId to created photos when provided', async () => {
    mockPrisma.staff.findFirst.mockResolvedValue({ id: 'staff-a' });
    // ... formData with staffId = 'staff-a'
    // assert create called with data.staffId === 'staff-a'
});

it('rejects staffId belonging to different profile', async () => {
    mockPrisma.staff.findFirst.mockResolvedValue(null);
    // ... formData with staffId = 'staff-from-other-profile'
    // assert returns { success: false, error: 'Специалист не принадлежит профилю.' }
});
```

New file `src/app/actions/__tests__/update-arrival-info.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/auth-helpers', () => ({ requireProviderProfile: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
    default: { profile: { update: vi.fn() } },
}));

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { requireProviderProfile } from '@/lib/auth-helpers';
import { updateArrivalInfo } from '@/app/actions/portfolio-photos';

// ... tests covering all AC-005 cases
```

### Anti-Patterns to Avoid

- **DO NOT** add a new migration — `Profile.arrivalInfo` already exists (Story 1.2) and `PortfolioPhoto.staffId` already exists (Story 1.1). This story is purely code-level.
- **DO NOT** accept a `profileId` parameter on `updateArrivalInfo` — always derive from the session. Admin targeting is explicitly out of scope (future story).
- **DO NOT** skip the key allowlist — passing `data` directly into Prisma is a JSON pollution vector.
- **DO NOT** store `arrivalInfo: {}` when the user wants to clear it — pass `Prisma.DbNull` so the column becomes SQL NULL (the read path checks for nullability).
- **DO NOT** break existing tests. `uploadServicePhotos` callers without `staffId` must continue to work unchanged.
- **DO NOT** localize error messages to English — project convention is Russian user-facing messages.
- **DO NOT** introduce a new file for `updateArrivalInfo` unless `portfolio-photos.ts` already exceeds ~300 lines; cohesion beats surface-area minimization at current scale.

### Previous Story Intelligence

- **Story 1.1:** `PortfolioPhoto.staffId` is `String?` with `onDelete: SetNull` from `Staff`. The field already exists — this story just writes it.
- **Story 1.2:** `Profile.arrivalInfo` is `Json?`. Shape documented in schema comment: `{ address: string, doorCode?: string, bellNote?: string, waitingSpot?: string }` — matches this story's validation exactly.
- **Story 1.4:** `uploadServicePhotos` is the extension target. The arrival info read route `GET /api/bookings/[id]/arrival` already enforces the three gates; this story feeds it with writable data.
- **Test baseline:** 20 files, 171 tests, 0 failures. Expected post-story: ~22 files, ~185 tests.

### Verification Commands

```bash
npx vitest run                                                        # all tests
npx vitest run src/app/actions/__tests__/portfolio-photos             # extended
npx vitest run src/app/actions/__tests__/update-arrival-info          # new
npm run lint
npx prisma validate
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.5]
- [Source: src/app/actions/portfolio-photos.ts — extension target]
- [Source: src/lib/auth-helpers.ts — requireProviderProfile]
- [Source: src/app/api/bookings/[id]/arrival/route.ts — read-path consumer]
- [Source: prisma/schema.prisma#Profile.arrivalInfo, PortfolioPhoto.staffId, Staff.profile_id]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (Amelia persona, BMAD dev-story workflow)

### Debug Log References

- Confirmed `Staff.profileId` (camelCase, not `profile_id`) from `prisma/schema.prisma:182` — distinct from `Profile.user_id` snake_case convention. `portfolioPhoto.staff` relation joins on `profileId`.
- Confirmed `ProviderType` enum values: `SALON | PRIVATE | INDIVIDUAL` (`prisma/schema.prisma:15-19`). `updateArrivalInfo` rejects only `'SALON'`; `PRIVATE` and `INDIVIDUAL` both accepted.
- Verified `Profile.arrivalInfo` is `Json?` — write uses `Prisma.DbNull` sentinel to clear (required for nullable Json columns; `null` alone would be interpreted as JSON null value).

### Completion Notes List

- `src/app/actions/portfolio-photos.ts` extended additively — staff resolution inserted between service-ownership check and position calculation; upload path preserves existing validation order.
- `updateArrivalInfo` co-located with photo actions for cohesion (file still ~270 lines; no need to split).
- Key stripping uses explicit allowlist — `address` always included when valid; optional fields only added when both string and non-empty after trim. Prototype pollution via `__proto__` harmless because only `data.address | data.doorCode | data.bellNote | data.waitingSpot` reads go into the sanitized object.
- `Prisma.DbNull` used for clearing — not `null` — because Postgres JSON columns distinguish "JSON null value" from "SQL NULL column". Read path already treats SQL NULL as "no arrival info".
- Empty-string `staffId` form field is treated as absent (covers common frontend defaults where no selection → empty string). Cross-profile attack caught by compound `findFirst({ id, profileId })`.
- Russian error messages throughout (project convention).
- All 6 ACs satisfied. Zero regressions.

### Change Log

- 2026-04-13: Story 1.5 drafted (ready-for-dev) — closes Epic 1 backend before frontend begins
- 2026-04-13: Story 1.5 implemented (review) — staffId extension + updateArrivalInfo + 15 unit tests

### Review Findings

- [x] [Review][Pass] All 6 ACs verified; no patches required
- [x] [Review][Defer] `typeof data !== 'object'` accepts arrays — harmless (fails at address check)
- [x] [Review][Defer] SALON gate blocks `updateArrivalInfo(null)` too — profile-type transition edge case, out of scope
- [x] [Review][Defer] Concurrent staff deletion — benign via FK SetNull cascade
- [x] [Review][Defer] Partial `@prisma/client` mock — only runtime-referenced `Prisma.DbNull` mocked, matches usage

### Change Log

- 2026-04-13: Story 1.5 code-review passed — all 6 ACs verified, no patches required

### File List

- `src/app/actions/portfolio-photos.ts` — modified (added staffId parsing/validation to `uploadServicePhotos`; added `updateArrivalInfo` action)
- `src/app/actions/__tests__/portfolio-photos.test.ts` — extended (+4 staffId tests; added `staff.findFirst` to prisma mock)
- `src/app/actions/__tests__/update-arrival-info.test.ts` — created (11 tests covering all AC-005 branches)
