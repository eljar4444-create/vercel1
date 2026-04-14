# TECHNICAL HANDOFF — `/salon/[slug]` Redesign

**Target:** BMAD Developer Agent (Antigravity IDE)
**Source:** Claude Opus 4.6 (Amelia persona, BMAD v6.2.2 workflow)
**Repo:** `project-svoi` (Next.js 14, App Router, NextAuth v5 JWT, Prisma 5, PostgreSQL, Vitest 4)
**Sprint:** `salon-slug-redesign`
**Date:** 2026-04-14

---

## 0. READ-BEFORE-WRITE ARTIFACTS (MANDATORY)

```
_bmad-output/BLUEPRINT-salon-slug-redesign.md            # architectural contract
_bmad-output/planning-artifacts/epics.md                 # epic + story definitions
_bmad-output/implementation-artifacts/sprint-status.yaml # live status of every story
_bmad-output/implementation-artifacts/1-*.md             # Epic 1 (done)
_bmad-output/implementation-artifacts/2-1-*.md           # Story 2.1 (done)
_bmad-output/implementation-artifacts/2-2-*.md           # Story 2.2 (done)
_bmad-output/implementation-artifacts/2-3-*.md           # Story 2.3 (review — current)
```

Do not start a story without reading its `.md` file. Story files carry dev-notes, anti-patterns, and reference patterns that are NOT derivable from code.

---

## 1. LOCKED ARCHITECTURAL RULES — DO NOT VIOLATE

### 1.1 Unified components via `isPrivate` boolean
There is ONE set of page components shared between Private Masters and Salons. Variant is driven by the derived prop `isPrivate = profile.provider_type !== 'SALON'`. **Never** fork a component into `*Private.tsx` / `*Salon.tsx`. Branch within the component on `isPrivate`.

### 1.2 Craft Wall (Private) vs Interior Strip (Salon) — different primitives
- **Private Master:** `<CraftWallGrid>` — dominant 2/3-column masonry grid of work photos. This IS the hero.
- **Salon:** Horizontal-scroll `<InteriorPhotoStrip>` of establishing shots. Work photos live **inside specialist deep-dive modals**, NOT in a top-level grid.
- Do not render a Craft Wall on a Salon page. Do not render an Interior Strip on a Private page.

### 1.3 Deep Dive Modal — no inline carousels
Photo drill-down (salon service → photos, salon specialist → photos) opens a modal containing `<CraftWallGrid>`. Do **not** add inline carousels, lightbox sliders, or Swiper components to the profile page. One pattern: thumbnail strip on the row → tap → modal with full grid.

### 1.4 Implicit tagging — the upload destination IS the classification
`PortfolioPhoto` records carry `(profileId, serviceId?, staffId?)`. These are populated **by the UI surface the admin uploaded from** — never via a post-hoc "tag this photo" dialog.
- Upload from Service card → `serviceId` set, `staffId` null (salon-level service photo)
- Upload from Staff modal → service row → `serviceId` + `staffId` both set (specialist work)
- Upload from Salon Interior (Story 2.5, pending) → `serviceId` null, `staffId` null
- Never prompt the user to classify after the fact.

### 1.5 Staff have no auth
`Staff` rows are metadata on `Profile` (name, bio, avatarUrl, schedule). They are **not** User accounts. They have no login, no dashboard, no session. All curation is performed by the salon admin (the `Profile`'s owning `User`). Do not build a "staff login" flow. Any feature implying staff self-service requires a new epic (User↔Staff relation, invite flow, permission scoping).

### 1.6 No cookies
Project-wide convention: **strictly no cookies** for application state. Session tokens flow via NextAuth's JWT strategy. Do not add `document.cookie` writes, do not introduce `js-cookie`, do not add new `Set-Cookie` headers from route handlers. If state must persist cross-request, use the database or JWT claims.

### 1.7 Russian user-facing strings
All copy visible to end users is Russian. Do not localize to English. Do not introduce i18n scaffolding.

### 1.8 No new DnD library
`framer-motion@^12.38.0` is already installed; its `Reorder` namespace handles mouse + touch + pointer + animations. Do not add `@dnd-kit`, `react-dnd`, `react-beautiful-dnd`, or `swiper`.

### 1.9 Minimal-churn posture
Do not refactor unrelated code. Do not rename identifiers. Do not touch legacy fields (`Service.images[]`, `Profile.gallery[]`, `Profile.studioImages[]`) until the explicit deprecation story. Additive migration only.

---

## 2. DATA MODEL (CANONICAL)

```prisma
model PortfolioPhoto {
  id        String   @id @default(cuid())
  profileId Int
  serviceId Int?     // null = interior/vibe (Story 2.5)
  staffId   String?  // null = no attribution (private master, or salon-level service photo)
  url       String
  position  Int      // 0 = cover for that (serviceId) bucket
  createdAt DateTime @default(now())
  profile   Profile  @relation(fields: [profileId], references: [id], onDelete: Cascade)
  service   Service? @relation(fields: [serviceId], references: [id], onDelete: SetNull)
  staff     Staff?   @relation(fields: [staffId],  references: [id], onDelete: SetNull)

  @@index([profileId, serviceId])
  @@index([staffId])
}
```

**Position semantics:** `position` is relative order within the `(profileId, serviceId)` bucket. Gaps after a delete are tolerated — the renderer sorts by position but does not require contiguity. Next upload/reorder re-normalizes.

---

## 3. SERVER ACTIONS (AUTHORITATIVE)

File: `src/app/actions/portfolio-photos.ts`

| Action | Signature | Auth | Notes |
|---|---|---|---|
| `uploadServicePhotos` | `(formData: FormData) => Promise<UploadResult>` | session + profile ownership | Reads `serviceId`, `staffId` (optional, validated against profile), `photos[]`. Creates records with `position = maxPos + 1 + i`. Already `staffId`-aware — do not modify for 2.3. |
| `reorderServicePhotos` | `(serviceId: number, photoIdOrder: string[]) => MutationResult` | session + profile ownership | Requires FULL photo list for service. Rejects partial lists. Staff-scoped reorder needs a new action (Story 2.6). |
| `deletePortfolioPhoto` | `(photoId: string) => MutationResult` | session + photo ownership | Per-id delete. Safe for staff-scoped UI. |
| `updateArrivalInfo` | `(data: ArrivalInfoInput \| null) => MutationResult` | session; rejects `provider_type === 'SALON'` | Story 2.4 target. Writes `Profile.arrivalInfo` JSON. |

`revalidatePath('/dashboard', 'layout')` is called on every successful write. Do not also call `router.refresh()` on the client — causes flashes.

---

## 4. EPIC 2 — COMPLETION STATUS

```yaml
epic-2: in-progress
  2-1-private-master-per-service-upload: done
  2-2-cover-photo-management:             done
  2-3-salon-admin-specialist-upload:      review   # ← smoke test in progress
  2-4-arrival-info-input:                 backlog
  2-5-salon-interior-photo-management:    backlog  # split from 2.3 AC-004
  2-6-staff-scoped-photo-reorder:         backlog  # deferred from 2.3 AC-006
```

### 4.1 Story 2.3 — implemented in last session

**Files touched:**
- `src/components/dashboard/ServicePhotoUpload.tsx` — dual-mode. `staffId?: string` prop. When present: plain `<div>` strip (no Reorder.Group), Set-as-cover button hidden, FormData gets `staffId`. Cover badge at idx 0 + delete still render. Inline `TODO(2.6)` at the reorder branch.
- `src/components/dashboard/StaffPhotosModal.tsx` — **new**. Collapsible service list per specialist; each expanded row mounts `ServicePhotoUpload` scoped to `(serviceId, staffId)` with `initialPhotos` filtered to `staffId === staff.id`.
- `src/components/dashboard/StaffSection.tsx` — `<Camera>` entry point per staff card → opens modal. New `services?` prop. Photo count badge (`📷 N фото`) per card.
- `src/components/dashboard/ServicesSection.tsx` — `isSalonProvider` prop removed; `showPhotoUpload` always true.
- `src/app/dashboard/page.tsx` — `staffId` added to `photos` select + serialization; `serializedServices` threaded into `<StaffSection>`.
- `src/components/dashboard/__tests__/ServicePhotoUpload.test.tsx` — +3 tests (staff-scoped mode).
- `src/components/dashboard/__tests__/StaffPhotosModal.test.tsx` — new, 6 tests.

**Tests:** 23 files / 210 tests. Lint: 4 pre-existing warnings, 0 new. Build: clean.

### 4.2 Salon Admin fixes applied immediately after code review

The user reported five bugs against Story 2.3. Resolution:

| # | User report | Root cause | Fix |
|---|---|---|---|
| 5 | "Cannot upload photos under Услуги (as salon admin)" | `!isSalonProvider` gate in `ServicesSection.tsx` blocked the per-service uploader for salons | **Gate removed.** Salon admins now get the same per-service uploader as private masters. Photos get `serviceId` only, `staffId` null → salon-level service photos. |
| 1 | "Can't add photos without first selecting a service" | Modal empty state was terminal — no CTA | `StaffPhotosModal` empty state rewritten with **Добавить услугу** CTA that closes the modal and routes to `/dashboard?section=services`. |
| 2, 3 | "Uploaded photos don't show on public profile" | Downstream of #5 — no upload path existed for the salon admin, so nothing to render | No code change needed in public path. `salon/[slug]/page.tsx` + `ProfileClient.tsx` `ServiceRow` already plumb `portfolioPhotos[]` into the per-service strip. Awaiting user smoke-test. |
| 4 | "As a сотрудник I can't see or edit my photos" | See rule §1.5 — staff have no auth by design | **No code change.** Architectural decision. If staff self-service is required, scope a new epic. |
| — | UX polish | Staff curation state was invisible | Added `📷 N фото` badge per staff card in `StaffSection`, computed from `services.portfolioPhotos.filter(p => p.staffId === s.id).length`. |

**Gate matrix after fixes:**

| Upload surface | `serviceId` | `staffId` | Enabled for |
|---|---|---|---|
| Services tab → service card → strip | set | null | Private + Salon |
| Staff tab → card → camera → service row | set | set | Salon only |
| Salon Settings → Interior (Story 2.5) | null | null | Salon only |

---

## 5. TEST BASELINE

- Suite: `npx vitest run` → 23 files / 210 tests / 0 failures.
- Lint: `npm run lint` → 4 pre-existing warnings (`AvatarDropdown.tsx`, `MapPickerClient.tsx`, `homepage/SearchBar.tsx`, `provider/CityCombobox.tsx`). Do not add new warnings.
- Build: `npm run build` → clean. Dashboard route: 137 kB.
- Typecheck: `npx tsc --noEmit` → pre-existing errors only in legacy test files; zero new errors in production code.

Every story must end green on all four.

---

## 6. TECH STACK CONSTRAINTS

- Next.js 14 App Router, React 18, TypeScript strict
- NextAuth v5 (JWT). `auth()` returns `{ user: { id, email, role, isBanned } }`
- Prisma 5.22.0 / PostgreSQL. `prisma.$transaction` for multi-write ops.
- Upload storage: Vercel Blob in prod (`BLOB_READ_WRITE_TOKEN`), local `uploads/` in dev. Use `savePublicUpload` from `@/lib/server/public-upload`; never construct paths by hand.
- Client state: `useState` / `useReducer`. No Redux. No Zustand.
- Drag / reorder: `framer-motion` `Reorder.Group` + `Reorder.Item`. Use `whileDrag` for feedback; commit on drop via `onReorder`.
- Toasts: `react-hot-toast`. `toast.success` / `toast.error`. Copy in Russian.
- Confirmations: `window.confirm` is acceptable per project convention.

---

## 7. NEXT STORY IN QUEUE

**Story 2.4 — Arrival Info Input (Private Master only)**
Target file: new dashboard section + re-use of `updateArrivalInfo` (already implemented in Epic 1). Fields: `address` (required), `doorCode`, `bellNote`, `waitingSpot` (all optional). Salon `provider_type` must NOT see this section. Revealed to clients post-booking-confirmation via existing `/api/bookings/[id]/arrival` route.

Do not start 2.4 until the user confirms 2.3 smoke test has passed and 2.3 is moved to `done` in `sprint-status.yaml`.

---

## 8. ACKNOWLEDGMENT PROTOCOL — REQUIRED BEFORE WRITING ANY CODE

On receipt of this handoff, respond with **exactly** the following structure (no prose, no narrative):

```
ACK: context loaded.
Architecture rules confirmed: 1.1–1.9.
Epic 2 status parsed: 2.1 done, 2.2 done, 2.3 review, 2.4–2.6 backlog.
Story 2.3 fixes applied: #1 empty-state CTA, #2/3 plumbing verified, #4 architectural no-op, #5 gate removed, +photo count badge.
Test baseline: 23 files / 210 tests green.
Standing by for smoke-test result on Salon Admin flow.
No code will be written until user confirms 2.3 → done.
```

After posting ACK, **stop**. Do not begin Story 2.4. Do not refactor. Do not "improve" anything. Wait for the user's smoke-test report on the Story 2.3 Salon Admin flow. If the user reports a regression, patch under the 2.3 scope. If the user confirms green, they will then issue `create-story` for 2.4.

End of handoff.
