# Epics: `/salon/[slug]` Redesign — "Craft Wall + Cover Photo + Deep Dive Modal"

**Source Blueprint:** `_bmad-output/BLUEPRINT-salon-slug-redesign.md`
**Source Brainstorm:** `_bmad-output/brainstorming/brainstorming-session-2026-04-11-001.md`
**Date:** 2026-04-12
**Author:** Eljar (Product), Claude (Facilitation)

---

## Overview

Redesign the provider profile page (`/salon/[slug]`) from a basic digital business card into a high-converting portfolio page. The architecture is binary: **Private Master** (personality-driven, work-as-hero, 1-step booking) vs **Salon** (establishment-driven, team directory, 2-step booking with specialist routing).

**Key architectural decisions (locked):**
- Portfolio photos uploaded per-service (implicit tagging, zero friction)
- Global "Craft Wall" grid = random mix of all photos (no filter chips)
- Each service shows one cover photo + "See N more photos" deep dive modal
- Private Master: address hidden until post-booking (Arrival Orchestration)
- Salon: specialist selection modal with photo-to-booking shortcut
- Unified component architecture — same components, different data shapes

**Provider type branching:** `provider_type !== 'SALON'` = Private Master (covers both `PRIVATE` and `INDIVIDUAL` enum values).

---

## Epic 1: Data Model — PortfolioPhoto + Schema Enhancements

**Business value:** Replace flat String[] image arrays with a structured `PortfolioPhoto` model that supports per-service photo grouping, staff attribution (Salon watermarks), cover photo ordering, and efficient queries for Craft Wall, deep dive modals, and specialist portfolios.

**Depends on:** Nothing (foundation epic, must be completed first)

### Story 1.1: Create PortfolioPhoto Prisma Model

As a developer,
I want a `PortfolioPhoto` model with relations to Profile, Service, and Staff,
so that photos can be queried by service, by specialist, or globally for the Craft Wall.

**Acceptance Criteria:**
- AC-001: `PortfolioPhoto` model exists in `prisma/schema.prisma` with fields: `id` (cuid), `url` (String), `profileId` (Int, FK → Profile), `serviceId` (Int?, FK → Service), `staffId` (String?, FK → Staff), `position` (Int, default 0), `createdAt` (DateTime)
- AC-002: Cascade delete from Profile. SetNull from Service and Staff.
- AC-003: Indexes on `profileId`, `serviceId`, `staffId`, and composite `[profileId, serviceId]`
- AC-004: Relations added to Profile (`photos`), Service (`photos`), and Staff (`photos`)
- AC-005: Migration runs successfully against existing database without data loss
- AC-006: Prisma Client generates correctly with new model

**Technical notes:**
- Current schema: `prisma/schema.prisma`
- Existing image fields to be deprecated later (NOT removed in this story): `Profile.gallery`, `Profile.studioImages`, `Service.images`
- `position: 0` = cover photo for a given service

### Story 1.2: Add Staff.specialty and Profile.arrivalInfo Fields

As a developer,
I want `Staff.specialty` (String?) and `Profile.arrivalInfo` (Json?) fields,
so that specialist cards show roles and Private Masters can store arrival details.

**Acceptance Criteria:**
- AC-001: `Staff.specialty` field added (String, optional, e.g., "Колорист")
- AC-002: `Profile.arrivalInfo` field added (Json, optional)
- AC-003: `arrivalInfo` schema documented in code comment: `{ address: string, doorCode?: string, bellNote?: string, waitingSpot?: string }`
- AC-004: Migration runs successfully without data loss

### Story 1.3: Data Migration Script — Existing Photos to PortfolioPhoto

As a developer,
I want a migration script that converts existing `Service.images`, `Profile.gallery`, and `Profile.studioImages` String[] data into `PortfolioPhoto` records,
so that existing data is preserved when the frontend switches to the new model.

**Acceptance Criteria:**
- AC-001: Script reads all `Service.images` arrays and creates `PortfolioPhoto` records with correct `profileId` + `serviceId`. First image in each array gets `position: 0` (cover).
- AC-002: Script reads all `Profile.gallery` arrays and creates `PortfolioPhoto` records with `profileId` only (`serviceId: null`, `staffId: null`).
- AC-003: Script reads all `Profile.studioImages` arrays and creates `PortfolioPhoto` records with `profileId` only, distinguishable from gallery photos (use a convention, e.g., a tag in URL or a separate query pattern).
- AC-004: Script is idempotent — running it twice does not create duplicates.
- AC-005: Script logs count of migrated records per profile.
- AC-006: Original String[] fields are NOT deleted — they remain as fallback until full migration is verified.

**Technical notes:**
- Run as a standalone Prisma seed/migration script
- Consider batching for large datasets
- Verify with `SELECT COUNT(*)` comparisons before/after

### Story 1.4: API Endpoints — PortfolioPhoto CRUD + Queries

As a developer,
I want API endpoints for photo upload, reorder, deletion, and query by profile/service/staff,
so that the dashboard and profile page can use the new PortfolioPhoto model.

**Acceptance Criteria:**
- AC-001: `POST /api/dashboard/services/[id]/photos` — upload photos to a service. Creates PortfolioPhoto records. Auto-assigns `position: 0` to first photo if service has none. Authenticated, owner-only.
- AC-002: `PATCH /api/dashboard/services/[id]/photos/reorder` — reorder photos / change cover (swap position values). Authenticated, owner-only.
- AC-003: `DELETE /api/dashboard/photos/[id]` — delete a single photo. Authenticated, owner-only.
- AC-004: `GET /api/salon/[slug]/photos` — all photos for a profile, random order (for Craft Wall). Public. Paginated.
- AC-005: `GET /api/salon/[slug]/photos?serviceId=X` — photos for a specific service, ordered by position (for deep dive). Public.
- AC-006: `GET /api/salon/[slug]/photos?staffId=Y` — photos by a specific specialist (for specialist deep dive). Public.
- AC-007: `GET /api/bookings/[id]/arrival` — returns `Profile.arrivalInfo` only for confirmed bookings on Private Master profiles. Authenticated, booking-owner only.
- AC-008: All endpoints return proper error codes (401, 403, 404) and validate input.

**Technical notes:**
- Photo file upload should go to existing storage (check current upload implementation pattern)
- `GET` endpoints for public data should be cacheable
- Craft Wall query: `WHERE profileId = X`, shuffled server-side or client-side
- The `arrivalInfo` endpoint MUST NOT expose data for non-confirmed bookings or for Salon profiles

### Story 1.5: Backend Completeness — Staff Attribution + Arrival Info Write

As a developer,
I want `uploadServicePhotos` extended to accept optional `staffId` and a new `updateArrivalInfo` server action,
so that Epic 2 (Dashboard) can attribute photos to specialists and save Private Master arrival details without further backend work.

**Acceptance Criteria:**
- AC-001: `uploadServicePhotos` accepts optional `staffId` (String?) in FormData. When provided, photos are created with that `staffId`. Validates `staffId` belongs to the same profile as the service (else returns error).
- AC-002: `updateArrivalInfo(data)` server action writes `Profile.arrivalInfo` JSON. Validates shape: `{ address: string, doorCode?: string, bellNote?: string, waitingSpot?: string }`. `address` is required and non-empty.
- AC-003: `updateArrivalInfo` rejects for Salon profiles (`provider_type === 'SALON'`) — returns error. Only Private Masters and Individuals can have arrival info.
- AC-004: Ownership-gated: only the profile owner (or admin) can call `updateArrivalInfo` for that profile.
- AC-005: Unit tests cover: staff attribution happy path, cross-profile staff rejection, arrival info shape validation, Salon rejection, ownership rejection.
- AC-006: Zero regressions against baseline.

**Technical notes:**
- Extend existing `src/app/actions/portfolio-photos.ts` for AC-001
- Add `updateArrivalInfo` to `src/app/actions/portfolio-photos.ts` OR create `src/app/actions/arrival-info.ts` (developer's call based on file-cohesion judgment)
- Strip unknown keys from arrivalInfo before persist to prevent JSON pollution
- No new database migration — `Profile.arrivalInfo` exists from Story 1.2

---

## Epic 2: Dashboard — Photo Upload Flow

**Business value:** Enable masters and salon admins to upload photos per-service with zero tagging friction. The upload destination IS the classification.

**Depends on:** Epic 1 (PortfolioPhoto model + API endpoints)

### Story 2.1: Private Master — Per-Service Photo Upload

As a Private Master,
I want to upload photos directly into a specific service in my dashboard,
so that my portfolio is automatically organized by service without manual tagging.

**Acceptance Criteria:**
- AC-001: Each service in the dashboard has an "Upload Photos" button/area
- AC-002: Multi-photo upload supported (batch select from device)
- AC-003: First photo uploaded for a service auto-becomes the cover (`position: 0`)
- AC-004: Subsequent photos get incrementing positions
- AC-005: Upload progress indicator shown during upload
- AC-006: After upload, photos appear in the service's photo list in the dashboard

**UX rules (non-negotiable):**
- NO "which service is this?" prompt at upload time
- NO mandatory metadata fields at upload time
- The act of uploading INTO a service folder IS the classification

### Story 2.2: Dashboard — Cover Photo Management

As a master or salon admin,
I want to reorder photos and change which photo is the cover for each service,
so that I can control which image visitors see first.

**Acceptance Criteria:**
- AC-001: Drag-and-drop reorder within a service's photo list
- AC-002: "Set as cover" action on any photo (swaps it to `position: 0`)
- AC-003: Delete individual photos with confirmation
- AC-004: Changes persist immediately (optimistic UI with API sync)

### Story 2.3: Salon Admin — Specialist + Service Photo Upload

As a salon admin,
I want to upload photos into a specific specialist's service folder,
so that photos are attributed to both the specialist and the service.

**Acceptance Criteria:**
- AC-001: Dashboard navigation: Team → [Specialist] → Services → [Service] → Upload Photos
- AC-002: Photos created with `profileId` (salon) + `serviceId` + `staffId`
- AC-003: Same multi-upload, cover photo auto-assignment, and reorder as Private Master
- AC-004: Salon admin can also upload interior/vibe photos (no service, no staff) via Salon Settings → Interior Photos

### Story 2.4: Salon Admin — Arrival Info Input (Private Master only)

As a Private Master,
I want to enter my arrival details (address, door code, bell info, nearby café) in the dashboard,
so that this information is revealed to clients after booking confirmation.

**Acceptance Criteria:**
- AC-001: Dashboard section for arrival details (only visible for `provider_type !== 'SALON'`)
- AC-002: Fields: exact address, door code (optional), bell/intercom note (optional), waiting spot recommendation (optional)
- AC-003: Saved as `Profile.arrivalInfo` JSON
- AC-004: Preview of how the Arrival Ritual Card will look to the client

---

## Epic 3: Profile Page — Shared Components

**Business value:** Build the reusable component library that both Private Master and Salon pages consume. One codebase, two layouts.

**Depends on:** Epic 1 (API endpoints for photo queries)

### Story 3.1: CraftWallGrid Component

As a visitor,
I want to see a visually striking grid of the master's work when I land on their profile,
so that I immediately understand the quality of their craft.

**Acceptance Criteria:**
- AC-001: Responsive photo grid: 2 columns mobile, 3 tablet, 4 desktop
- AC-002: Photos displayed in random order (shuffled from all services)
- AC-003: Lazy-loaded with shimmer placeholders
- AC-004: Tapping a photo opens `DeepDiveModal` in lightbox mode at that photo
- AC-005: Old Money styling: neumorphic soft shadows on tiles, subtle rounded corners, beige `booking-bg` background
- AC-006: No filter chips, no sorting controls
- AC-007: Handles empty state gracefully (component not rendered when 0 photos)

**Technical notes:**
- Reused in two contexts: Private Master page hero AND Salon specialist deep dive modal
- Data: `GET /api/salon/[slug]/photos` (all photos) or `?staffId=Y` (specialist photos)
- Consider progressive loading (show 2-3 rows initially, "Show more" or infinite scroll)

### Story 3.2: ServiceMenu + ServiceMenuRow Components

As a visitor,
I want to see a clean list of services with prices and a preview photo,
so that I can quickly find what I need and see proof of the master's work for that service.

**Acceptance Criteria:**
- AC-001: `ServiceMenu` renders a list of `ServiceMenuRow` components
- AC-002: Each `ServiceMenuRow` shows: service name (Playfair Display), duration, price, booking CTA
- AC-003: If service has photos: shows cover photo (first photo, `position: 0`) as a thumbnail alongside the service info
- AC-004: If service has >1 photo: shows "See N more photos" text link below the cover photo
- AC-005: If service has 0 photos: clean text-only row — NO placeholder image, NO empty carousel, NO "upload" prompt
- AC-006: "See N more photos" taps opens `DeepDiveModal` with all photos for that service
- AC-007: Salon variant: small text below service name showing which specialists offer this service (e.g., "Анна, Лиза")

**UX rules enforced:**
- "See N more photos" link only renders when `photos.length > 1`
- Price is always visible — no "DM for price", no hidden pricing

### Story 3.3: DeepDiveModal Component

As a visitor,
I want to browse all photos for a service (or all photos by a specialist) in a fullscreen gallery,
so that I can evaluate the master's work in detail before booking.

**Acceptance Criteria:**
- AC-001: Full-screen overlay with glassmorphism backdrop blur
- AC-002: Grid view (default): shows all photos in a grid, similar to CraftWallGrid
- AC-003: Lightbox view (on photo tap): single photo with swipe/arrow navigation
- AC-004: Close button (X) + tap-outside-to-close + Escape key
- AC-005: Title bar shows context (e.g., "Балаяж" or "Anna's Portfolio")
- AC-006: `showSpecialistBadge` prop: when true, each photo in grid/lightbox shows a small specialist avatar + name badge in the corner
- AC-007: "Book this look" CTA in lightbox view. For Salon with badge: pre-selects that specialist (passes `staffId` to booking flow)
- AC-008: Smooth open/close animation
- AC-009: Handles edge cases: single photo (no navigation arrows), swipe at last photo wraps to first

**Reuse contexts:**
- Service "See N more photos" → photos filtered by `serviceId`
- Specialist "See Anna's photos" → photos filtered by `staffId`
- Craft Wall photo tap → all photos, starting from tapped photo

### Story 3.4: BookingCTA Component

As a visitor,
I want to book a service with minimal steps,
so that I can secure my appointment quickly.

**Acceptance Criteria:**
- AC-001: Private Master: tap → navigates to calendar/time-slot picker for that service. 1 step.
- AC-002: Salon (multiple specialists for service): tap → opens `SpecialistSelector` modal. 2 steps.
- AC-003: Salon (single specialist for service): tap → navigates directly to calendar with specialist pre-selected. 1 step. (Conditional skip)
- AC-004: Salon (from watermarked photo): tap → navigates to calendar with watermarked specialist pre-selected. 1 step. (Photo-to-booking shortcut)
- AC-005: Consistent visual style across all contexts (hero CTA, service row CTA, modal CTA): forest green `booking-primary` background, white text, neumorphic shadow

### Story 3.5: SpecialistSelector Modal (Salon only)

As a salon visitor,
I want to choose which specialist I'd like for my service (or pick "any available"),
so that I can book with the person whose work I liked.

**Acceptance Criteria:**
- AC-001: Modal shows only specialists who offer the selected service
- AC-002: Each specialist card: avatar, name, rating, review count, nearest available time slot
- AC-003: "Any available specialist" option at the bottom
- AC-004: Selecting a specialist → navigates to calendar with that specialist pre-selected
- AC-005: Auto-skipped when only 1 specialist offers the service (never shows a 1-option modal)
- AC-006: Pre-selected when visitor arrived from a watermarked photo in DeepDiveModal (modal may not open at all if pre-selection is unambiguous)

---

## Epic 4: Profile Page — Layout Assembly

**Business value:** Compose the shared components into two distinct page layouts (Private Master and Salon) that deliver the correct visual hierarchy and booking flow for each provider type.

**Depends on:** Epic 3 (all shared components built)

### Story 4.1: Private Master Page Layout

As a visitor on a Private Master's profile,
I want to see a visually stunning portfolio grid dominating the page, with a clean service menu below,
so that I trust this master's quality and can book easily.

**Acceptance Criteria:**
- AC-001: Screen 1 (above the fold): `EntityHero` Private variant — small avatar (80px), master name (Playfair Display), first-person bio one-liner, neighborhood + radius (no street address), sticky "Записаться" CTA, followed by `CraftWallGrid` filling 60-70% of viewport height
- AC-002: Screen 2 (scroll): `ServiceMenu` with cover photos and deep dive links, per-service inline `BookingCTA` (1-step)
- AC-003: Reviews section below services (existing component, adapted to new layout)
- AC-004: Mobile: CTA becomes sticky bottom bar on scroll past the hero
- AC-005: No address visible anywhere on the public page. Location shown as neighborhood + radius only.
- AC-006: Bio placeholder text in first-person: "Я специализируюсь на..." (enforced at onboarding, displayed on profile)

**UX rules enforced:**
- Private Master screen 1 must be visually richer than Salon screen 1
- The work IS the hero. The face is secondary.
- No filter chips on the Craft Wall

### Story 4.2: Salon Page Layout

As a visitor on a Salon's profile,
I want to see the establishment's brand, team, and services clearly organized,
so that I can choose a specialist and book with confidence.

**Acceptance Criteria:**
- AC-001: Screen 1: `EntityHero` Salon variant — logo, salon name, full street address, salon description, horizontal interior photo strip (scrollable)
- AC-002: Screen 2: `TeamSection` — grid of `SpecialistCard` components. Each card: avatar, name, `Staff.specialty`, rating, "See [Name]'s N photos" deep dive link
- AC-003: Screen 3: `ServiceMenu` — same as Private Master but with specialist names per service and 2-step booking flow
- AC-004: Deep dive on specialist card → `DeepDiveModal` with `CraftWallGrid` showing that specialist's photos across all services
- AC-005: Deep dive on service row → `DeepDiveModal` with `showSpecialistBadge: true` (photos show which specialist did the work)
- AC-006: Booking from watermarked photo → pre-selects specialist, skips `SpecialistSelector`
- AC-007: Reviews section below services

### Story 4.3: ArrivalRitualCard — Post-Booking Reveal

As a client who booked a Private Master,
I want to receive the full address and arrival details after my booking is confirmed,
so that I know exactly how to get there.

**Acceptance Criteria:**
- AC-001: Card appears on the booking confirmation page AND in "My Bookings" detail view
- AC-002: Shows: exact address, door code (if provided), bell/intercom note (if provided), waiting spot recommendation (if provided)
- AC-003: Only rendered for confirmed bookings on Private Master profiles (`provider_type !== 'SALON'`)
- AC-004: Data fetched from `GET /api/bookings/[id]/arrival` (authenticated endpoint)
- AC-005: Old Money styling: warm card with neumorphic shadow, subtle gold accent border
- AC-006: If `arrivalInfo` is null/empty, card is not rendered (no broken empty state)

---

## Epic 5: Onboarding Enhancements

**Business value:** Ensure new masters and salons are guided to populate their profiles correctly from day one, without adding friction.

**Depends on:** Epics 2 + 4 (dashboard upload flow + profile page exist)

### Story 5.1: Private Master Onboarding — First-Person Bio Placeholder

As a new Private Master completing onboarding,
I want placeholder text in my bio field that models first-person voice,
so that I naturally write "I specialize in..." instead of "Master Maria specializes in..."

**Acceptance Criteria:**
- AC-001: Bio textarea placeholder: "Я специализируюсь на... (например: «Помогу найти ваш идеальный блонд»)"
- AC-002: Character limit guidance (optional, not enforced): "One sentence is enough"
- AC-003: Placeholder visible in both onboarding flow and dashboard edit

### Story 5.2: Private Master Onboarding — Arrival Info Prompt

As a new Private Master completing onboarding,
I want to be prompted to enter my arrival details,
so that my first clients have a smooth experience.

**Acceptance Criteria:**
- AC-001: Onboarding step (after services are added): "How do clients find you?" form
- AC-002: Fields: address, door code, bell note, nearby café/landmark
- AC-003: Skippable ("I'll add this later") — NOT mandatory
- AC-004: Explanation text: "This info is only shown to clients after they book with you."

### Story 5.3: Photo Upload Prompt — Post-Service Setup

As a new master who just added services,
I want a gentle prompt encouraging me to upload photos for my services,
so that my profile has visual proof of my work.

**Acceptance Criteria:**
- AC-001: After a master adds a service with 0 photos, show an inline prompt: "Upload photos of your best [service name] work to attract more clients"
- AC-002: Prompt links directly to the upload area for that service
- AC-003: Prompt disappears once at least 1 photo is uploaded for that service
- AC-004: Never shown on the public profile page — dashboard only

---

## Dependency Graph

```
Epic 1 (Data Model)
  ├── Epic 2 (Dashboard Upload) ← depends on E1
  ├── Epic 3 (Shared Components) ← depends on E1
  │     └── Epic 4 (Page Layouts) ← depends on E3
  └── Epic 5 (Onboarding) ← depends on E2 + E4
```

**Recommended build order:** E1 → E2 + E3 (parallel) → E4 → E5

---

## Non-Functional Requirements (All Epics)

- **Performance:** Lazy-load all photo grids. No above-the-fold layout shift from image loading (use aspect-ratio placeholders).
- **Accessibility:** All images must have alt text (auto-generated: "[Master name] — [Service name]"). Modal must trap focus and support Escape to close.
- **Mobile-first:** All components designed mobile-first. CraftWallGrid: 2 columns. ServiceMenu: full-width cards. DeepDiveModal: fullscreen with swipe.
- **Design system:** All components use existing tokens: `booking-bg`, `booking-primary`, `booking-card`, neumorphic shadow system, Playfair Display headings, `#C2A363` gold accents.
- **Testing:** Each story must have unit tests for component rendering + integration tests for API endpoints. E2E tests for critical booking flows.
