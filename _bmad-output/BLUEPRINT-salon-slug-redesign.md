# Blueprint: `/salon/[slug]` Redesign

**Concept Name:** Craft Wall + Cover Photo + Deep Dive Modal
**Author:** Eljar (Product), Claude (Facilitation)
**Date:** 2026-04-12
**Status:** Approved for implementation
**Source:** Brainstorming session `brainstorming-session-2026-04-11-001.md`

---

## 1. Architecture Overview

The profile page has two distinct visual identities driven by `provider_type`:

- **Private Master** (`PRIVATE` / `INDIVIDUAL`): The work IS the brand. A dominant photo grid ("Craft Wall") fills 60-70% of screen 1. Identity, bio, and location orbit the grid. We sell the artisan.
- **Salon** (`SALON`): The establishment IS the brand. Logo, address, interior photos, and a team directory lead. We sell the place and its people.

Both page types share the same core components. The difference is layout composition and data routing, not separate codebases.

**Three structural pillars:**

| Pillar | What it solves |
|---|---|
| **Craft Wall Grid** | Premium first impression. Visual proof of quality. Private Master dignity. |
| **Cover Photo + Deep Dive Modal** | Photo-to-service connection without carousels or tagging friction. |
| **Staff Router** | Salon multi-specialist booking without adding steps for Private Masters. |

---

## 2. Core Components

### 2.1 `<CraftWallGrid>`

**What it is:** A masonry or uniform photo grid displaying a random mix of the provider's work across all services.

| Context | Behavior |
|---|---|
| Private Master — page hero | Dominates 60-70% of screen 1. All photos from all services, randomly shuffled. Macro work photography. This IS the first impression. |
| Salon — specialist deep dive modal | When a visitor taps "See Anna's 45 photos" on a specialist card, the modal opens with a `<CraftWallGrid>` showing that specialist's work across all their services. |

**Props:**
- `photos: PortfolioPhoto[]` — the photo set to display
- `columns?: number` — responsive (2 on mobile, 3 on tablet, 4 on desktop)
- `maxInitialRows?: number` — how many rows to show before "Show more" (optional progressive loading)
- `onPhotoTap?: (photo) => void` — opens the photo in the `<DeepDiveModal>` lightbox view

**Design notes:**
- Old Money aesthetic: neumorphic card shadows on each photo tile, subtle rounded corners
- No filter chips. No sorting controls. The grid's job is vibe, not search.
- Lazy-loaded. Placeholder shimmer on scroll.

---

### 2.2 `<EntityHero>`

**What it is:** The top-of-page section. Completely different layouts for Private vs Salon.

#### Private Master variant:

```
┌─────────────────────────────────────────────────────┐
│                                                       │
│  ┌────────┐  Мария Иванова           [Записаться →]  │
│  │ Avatar │  "Помогу найти ваш идеальный блонд"      │
│  │ (80px) │  Частный кабинет · Mitte · 10 min U-Bahn │
│  └────────┘  ★ 4.9 (47 отзывов)                      │
│                                                       │
│  ┌───┐┌───┐┌───┐┌───┐┌───┐┌───┐┌───┐┌───┐           │
│  │   ││   ││   ││   ││   ││   ││   ││   │           │
│  │   ││   ││   ││   ││   ││   ││   ││   │  ← Craft  │
│  └───┘└───┘└───┘└───┘└───┘└───┘└───┘└───┘    Wall   │
│  ┌───┐┌───┐┌───┐┌───┐┌───┐┌───┐┌───┐┌───┐    Grid  │
│  │   ││   ││   ││   ││   ││   ││   ││   │           │
│  └───┘└───┘└───┘└───┘└───┘└───┘└───┘└───┘           │
└─────────────────────────────────────────────────────┘
```

- Avatar: small (80px), high-quality, secondary to the grid
- Name: Playfair Display serif
- Bio: one-liner, first-person, enforced via UI placeholder at onboarding
- Location: neighborhood + radius only. No street address.
- CTA: "Записаться" button, stays sticky on mobile scroll
- Craft Wall Grid: immediately below identity, dominates the viewport

#### Salon variant:

```
┌─────────────────────────────────────────────────────┐
│                                                       │
│  ┌──────┐  Studio Luxe                               │
│  │ Logo │  Friedrichstraße 42, 10117 Berlin          │
│  └──────┘  "Мы создаём пространство, где каждый..."  │
│            ★ 4.8 (124 отзыва)        [Записаться →]  │
│                                                       │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐           │
│  │ interior  │ │ interior  │ │ interior  │           │
│  │   photo   │ │   photo   │ │   photo   │  ← strip │
│  └───────────┘ └───────────┘ └───────────┘           │
└─────────────────────────────────────────────────────┘
```

- Logo: displayed at brand size, not avatar-cropped
- Full street address: openly visible (Salon has nothing to hide)
- Interior photo strip: horizontal scroll, establishing shots. NOT a dominant grid — the grid lives inside specialist modals.
- Salon bio: institutional voice is acceptable here

**Props:**
- `profile: ProfileData` — the full profile object
- `isPrivate: boolean` — derived from `provider_type !== 'SALON'`

---

### 2.3 `<TeamSection>` (Salon only)

**What it is:** A grid of specialist cards for the salon's staff.

```
┌─────────────────────────────────────────────────────┐
│  Наши мастера                                        │
│                                                       │
│  ┌────────────────────┐  ┌────────────────────┐      │
│  │  ┌────┐            │  │  ┌────┐            │      │
│  │  │ av │  Анна      │  │  │ av │  Лиза      │      │
│  │  └────┘  Колорист  │  │  └────┘  Стилист   │      │
│  │  ★ 4.9 (47)       │  │  ★ 4.8 (31)       │      │
│  │                    │  │                    │      │
│  │  See Anna's        │  │  See Lisa's         │      │
│  │  45 photos →       │  │  28 photos →        │      │
│  └────────────────────┘  └────────────────────┘      │
└─────────────────────────────────────────────────────┘
```

Each `<SpecialistCard>` contains:
- Avatar (medium, ~64px)
- Name
- Specialty / role text
- Rating + review count
- **"See [Name]'s N photos" deep dive link** → opens `<DeepDiveModal>` with a `<CraftWallGrid>` of that specialist's portfolio

**No inline thumbnails on the card.** The deep dive modal handles all portfolio browsing.

**Props:**
- `staff: StaffMember[]`
- `onSpecialistTap: (staffId) => void` — opens the deep dive modal

---

### 2.4 `<ServiceMenu>`

**What it is:** The clean price list. Identical component for both page types.

```
┌─────────────────────────────────────────────────────┐
│  Услуги и цены                                       │
│                                                       │
│  ┌───────────────────────────────────────────────┐   │
│  │  ┌─────┐  Балаяж                              │   │
│  │  │cover│  2.5 ч · от €150     [Записаться →]  │   │
│  │  │photo│                                      │   │
│  │  └─────┘  See 24 more photos →                │   │
│  └───────────────────────────────────────────────┘   │
│                                                       │
│  ┌───────────────────────────────────────────────┐   │
│  │           Тонирование                          │   │
│  │           1.5 ч · от €80      [Записаться →]  │   │  ← no photos:
│  └───────────────────────────────────────────────┘   │     clean text row
│                                                       │
│  ┌───────────────────────────────────────────────┐   │
│  │  ┌─────┐  Холодный блонд                      │   │
│  │  │cover│  3 ч · от €200       [Записаться →]  │   │
│  │  │photo│                                      │   │
│  │  └─────┘  See 8 more photos →                 │   │
│  └───────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

Each `<ServiceMenuRow>` contains:
- **Cover photo** (optional): the first photo uploaded for this service. If no photos exist, the row is a clean text-only row — no placeholder, no empty state.
- **Service name** (Playfair Display)
- **Duration + price** (transparent, no "DM for price")
- **"See N more photos →"** link: only visible when `photos.length > 1`. Opens `<DeepDiveModal>`.
- **"Записаться →"** CTA button

**Salon-specific addition:** Below the service name, a small line: "Анна, Лиза" — showing which specialists offer this service.

**Props:**
- `services: ServiceWithPhotos[]`
- `isPrivate: boolean`
- `onBook: (serviceId, staffId?) => void`
- `onDeepDive: (serviceId) => void`

---

### 2.5 `<DeepDiveModal>`

**What it is:** A full-screen lightbox/modal gallery. The single reusable component for all "see more photos" interactions.

**Trigger contexts:**

| Trigger | Content shown |
|---|---|
| "See 24 more photos" on a service row | All photos for that service |
| "See Anna's 45 photos" on a specialist card | All photos by that specialist (across all their services) |
| Tap a photo in the Craft Wall grid | Opens that photo in lightbox, swipe through all grid photos |

**Features:**
- Full-screen overlay with backdrop blur (glassmorphism)
- Photo grid view (default) + single-photo lightbox view (on tap)
- Swipe navigation in lightbox mode
- **Salon service modal only:** Each photo carries a small specialist badge (avatar + name) in the corner — the watermark.
- **"Book this look" CTA** on each photo in lightbox view. For Salons, this pre-selects the specialist shown in the watermark.
- Close button (X) + tap-outside-to-close

**Props:**
- `photos: PortfolioPhoto[]`
- `title: string` — e.g., "Балаяж" or "Anna's Portfolio"
- `showSpecialistBadge: boolean` — Salon service modals = true
- `onBook?: (serviceId, staffId?) => void`

---

### 2.6 `<BookingCTA>`

**What it is:** The booking action button. Appears in multiple contexts (hero card, service rows, deep dive modal).

| Provider type | Behavior |
|---|---|
| Private Master | Tap → navigate directly to calendar/time-slot picker for that service. **1-step.** |
| Salon (service has multiple specialists) | Tap → open `<SpecialistSelector>` modal → then calendar. **2-step.** |
| Salon (service has 1 specialist) | Tap → skip modal, navigate directly to calendar with that specialist pre-selected. **1-step.** |
| Salon (tapped from watermarked photo) | Tap → skip modal, navigate to calendar with watermarked specialist pre-selected. **1-step.** |

---

### 2.7 `<SpecialistSelector>` (Salon only)

**What it is:** A modal that appears between "Book" and the calendar, asking the visitor to choose a specialist.

```
┌─────────────────────────────────────┐
│  Выберите мастера для Балаяж        │
│                                     │
│  ┌─────────────────────────────┐    │
│  │  [av] Анна · ★ 4.9 (47)   │    │
│  │  Ближайшее время: Пт 14:00 │    │
│  └─────────────────────────────┘    │
│  ┌─────────────────────────────┐    │
│  │  [av] Лиза · ★ 4.8 (31)   │    │
│  │  Ближайшее время: Сб 10:00 │    │
│  └─────────────────────────────┘    │
│  ┌─────────────────────────────┐    │
│  │  Любой свободный мастер    │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

- Shows only specialists who offer the selected service
- Each card: avatar, name, rating, nearest available slot
- "Any available" option at the bottom
- **Auto-skipped** when only 1 specialist offers the service
- **Pre-selected** when visitor arrived from a watermarked photo

---

### 2.8 `<ArrivalRitualCard>` (Private Master only, post-booking)

**What it is:** A card that appears in the booking confirmation screen / "My Bookings" page after a Private Master booking is confirmed.

**Public profile shows:** "Частный кабинет · Mitte · 10 min от U-Bahn"
**Post-booking reveals:**

```
┌─────────────────────────────────────┐
│  Как добраться                      │
│                                     │
│  📍 Auguststraße 12, 10117 Berlin  │
│  🔔 Звонок "Мария", 3 этаж        │
│  🔑 Код двери: 4521#               │
│  ☕ Рядом: Café Oliv (2 мин)       │
│     отличное место подождать        │
└─────────────────────────────────────┘
```

**Data source:** Stored in `Profile.attributes` JSON or a dedicated `arrival_info` JSON field on Profile. Only exposed via API after booking confirmation.

---

## 3. Page Layouts (Full Assembly)

### 3.1 Private Master Page

```
┌─ SCREEN 1 (above the fold) ──────────────────────┐
│                                                     │
│  <EntityHero variant="private">                     │
│    ┌────────┐  Name · Bio · Location · CTA         │
│    │ Avatar │                                       │
│    └────────┘                                       │
│                                                     │
│    <CraftWallGrid photos={allPhotos} />             │
│    (60-70% of viewport)                             │
│                                                     │
└─────────────────────────────────────────────────────┘
┌─ SCREEN 2 (scroll) ──────────────────────────────┐
│                                                     │
│  <ServiceMenu>                                      │
│    <ServiceMenuRow service="Балаяж"                 │
│      coverPhoto={first} deepDive="See 24 more" />  │
│    <ServiceMenuRow service="Тонирование"            │
│      coverPhoto={null} />  ← clean text row         │
│    <ServiceMenuRow service="Холодный блонд"         │
│      coverPhoto={first} deepDive="See 8 more" />   │
│  </ServiceMenu>                                     │
│                                                     │
│  <ReviewsSection />                                 │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 3.2 Salon Page

```
┌─ SCREEN 1 (above the fold) ──────────────────────┐
│                                                     │
│  <EntityHero variant="salon">                       │
│    Logo · Name · Address · Bio · CTA               │
│    <InteriorPhotoStrip />                           │
│  </EntityHero>                                      │
│                                                     │
└─────────────────────────────────────────────────────┘
┌─ SCREEN 2 ────────────────────────────────────────┐
│                                                     │
│  <TeamSection>                                      │
│    <SpecialistCard name="Anna" photos={45} />       │
│    <SpecialistCard name="Lisa" photos={28} />       │
│  </TeamSection>                                     │
│                                                     │
└─────────────────────────────────────────────────────┘
┌─ SCREEN 3 ────────────────────────────────────────┐
│                                                     │
│  <ServiceMenu>                                      │
│    <ServiceMenuRow service="Балаяж"                 │
│      coverPhoto={first}                             │
│      specialists={["Anna", "Lisa"]}                 │
│      deepDive="See 24 more" />                      │
│    ...                                              │
│  </ServiceMenu>                                     │
│                                                     │
│  <ReviewsSection />                                 │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 4. Data Model

### 4.1 Current State (what exists)

```
Profile
  ├── gallery: String[]          ← flat URL list, no metadata
  ├── studioImages: String[]     ← flat URL list
  ├── image_url: String          ← single cover image
  └── provider_type: SALON | PRIVATE | INDIVIDUAL

Service
  ├── images: String[]           ← flat URL list, no staff attribution
  ├── price: Decimal
  └── duration_min: Int

Staff
  ├── name, avatarUrl, bio
  ├── schedule: Json
  └── → bookings[]

Booking
  └── staff_id: String?          ← staff routing already wired
```

**Problem:** String[] arrays cannot carry staff attribution (which specialist took this photo) or ordering (which photo is the cover). The salon watermark and cover-photo features require structured photo records.

### 4.2 Required Change: `PortfolioPhoto` Model

```prisma
model PortfolioPhoto {
  id        String   @id @default(cuid())
  url       String
  profileId Int
  serviceId Int?     // null = interior/vibe photo (Salon) or unassigned
  staffId   String?  // null = Private Master (no staff) or unassigned
  position  Int      @default(0)  // 0 = cover photo for this service
  createdAt DateTime @default(now())

  profile   Profile  @relation(fields: [profileId], references: [id], onDelete: Cascade)
  service   Service? @relation(fields: [serviceId], references: [id], onDelete: SetNull)
  staff     Staff?   @relation(fields: [staffId], references: [id], onDelete: SetNull)

  @@index([profileId])
  @@index([serviceId])
  @@index([staffId])
  @@index([profileId, serviceId])
}
```

**Query patterns this enables:**

| Need | Query |
|---|---|
| Craft Wall (Private Master) | `WHERE profileId = X` (all photos, shuffled) |
| Craft Wall (Salon specialist modal) | `WHERE profileId = X AND staffId = Y` |
| Service cover photo | `WHERE serviceId = Z AND position = 0 LIMIT 1` |
| Service deep dive | `WHERE serviceId = Z ORDER BY position` |
| Specialist photo count (for "See Anna's N photos") | `COUNT WHERE staffId = Y` |
| Salon interior photos | `WHERE profileId = X AND serviceId IS NULL AND staffId IS NULL` |

### 4.3 Staff Model Enhancement

```prisma
model Staff {
  // existing fields unchanged
  id        String  @id @default(cuid())
  profileId Int
  name      String
  avatarUrl String?
  bio       String?
  schedule  Json?

  // add:
  specialty String?   // e.g., "Колорист", "Стилист" — displayed on card

  profile   Profile          @relation(...)
  bookings  Booking[]
  photos    PortfolioPhoto[] // new relation
}
```

### 4.4 Profile Model — Arrival Info

```prisma
model Profile {
  // existing fields unchanged

  // add:
  arrivalInfo Json?
  // Structure: {
  //   address: "Auguststraße 12, 10117 Berlin",
  //   doorCode: "4521#",
  //   bellNote: "Звонок «Мария», 3 этаж",
  //   waitingSpot: "Café Oliv (2 мин) — отличное место подождать"
  // }
  // Only exposed in API responses for confirmed bookings.

  photos PortfolioPhoto[]  // new relation
}
```

### 4.5 Migration Path

The `PortfolioPhoto` model is additive — no existing tables change. Migration strategy:

1. Create `PortfolioPhoto` table
2. Write a one-time migration script that reads existing `Service.images` String[] URLs and creates `PortfolioPhoto` records with the correct `profileId` + `serviceId`
3. Similarly migrate `Profile.gallery` and `Profile.studioImages` into `PortfolioPhoto` (with `serviceId = null`)
4. Update API endpoints to read from `PortfolioPhoto` instead of String[] fields
5. Deprecate (but don't delete) the old String[] fields until migration is verified

---

## 5. Upload Flow

### 5.1 Private Master Dashboard

```
Dashboard → My Services → "Балаяж" → [Upload Photos]

1. Master taps "Upload Photos" on the Балаяж service
2. Selects 1-30 photos from device
3. System creates PortfolioPhoto records:
   - profileId = master's profile
   - serviceId = Балаяж service ID
   - staffId = null (no staff for Private)
   - position = auto-incremented (first upload = 0 = cover)
4. Photos appear in two places:
   a. The Craft Wall grid (all photos, random mix)
   b. The Балаяж service row (cover photo + "See N more" deep dive)
5. Master can reorder photos (drag-and-drop) or change cover photo
   (swaps position values)
```

**Zero tagging. Zero classification. Upload destination IS the classification.**

### 5.2 Salon Admin Dashboard

```
Dashboard → Team → "Anna" → Services → "Балаяж" → [Upload Photos]

1. Admin navigates to a specific specialist's service
2. Selects photos
3. System creates PortfolioPhoto records:
   - profileId = salon's profile
   - serviceId = Балаяж service ID
   - staffId = Anna's staff ID
   - position = auto-incremented
4. Photos appear in three places:
   a. Anna's specialist deep dive modal (all Anna's photos)
   b. The Балаяж service deep dive modal (with Anna's avatar watermark)
   c. The salon's global feed (if salon has a global gallery view)
5. Admin can also upload interior/vibe photos:
   Dashboard → Salon Settings → [Upload Interior Photos]
   → Creates records with serviceId = null, staffId = null
```

### 5.3 Cover Photo Logic

| Scenario | Cover photo |
|---|---|
| Master uploads first photo to a service | Auto-assigned as cover (`position: 0`) |
| Master uploads more photos | Appended after cover (`position: 1, 2, 3...`) |
| Master wants different cover | Dashboard: tap a photo → "Set as cover" → swaps `position` values |
| Service has 0 photos | No cover shown. Clean text row in the service menu. |

---

## 6. Booking Flow

### 6.1 Private Master — 1-Step

```
Visitor on profile page
  → Taps "Записаться" on a service row (or hero CTA)
  → Calendar / time-slot picker for that service
  → Confirms booking
  → Receives ArrivalRitualCard with full address + door code
```

### 6.2 Salon — 2-Step (Standard)

```
Visitor on profile page
  → Taps "Записаться" on a service row
  → <SpecialistSelector> modal opens:
      "Choose a specialist for Балаяж"
      - Anna · ★ 4.9 · Next: Fri 14:00
      - Lisa · ★ 4.8 · Next: Sat 10:00
      - Any available specialist
  → Selects specialist
  → Calendar / time-slot picker
  → Confirms booking
```

### 6.3 Salon — 1-Step (Auto-Skip)

```
Visitor taps "Записаться" on a service only Anna offers
  → Modal skipped (specialists.length === 1)
  → Calendar with Anna pre-selected
```

### 6.4 Salon — Pre-Selected (From Watermarked Photo)

```
Visitor in Балаяж deep dive modal
  → Sees a beautiful photo with Anna's watermark badge
  → Taps "Book this look" on that photo
  → Calendar with Anna pre-selected (staffId from photo record)
  → No specialist selector modal
```

---

## 7. Key UX Rules (Non-Negotiables)

These rules are locked. They were derived from three rounds of adversarial pressure-testing and are not open for reinterpretation.

### Portfolio & Photos

| # | Rule | Rationale |
|---|---|---|
| 1 | **No empty carousels.** Services with 0 photos display as clean text rows (name · duration · price). No placeholder images, no "upload your first photo" prompts on the public page. | Adversarial #1: Empty Carousel. An empty visual state is worse than no visual state. |
| 2 | **No mandatory manual tagging.** Masters upload photos INTO a service folder in their dashboard. The act of uploading IS the classification. No dropdowns, no multi-select tag pickers, no "which service is this?" prompts at upload time. | Adversarial #2: Tagging Burden. Per-upload friction kills adoption for high-volume masters. |
| 3 | **Cover photo is auto-assigned.** First photo uploaded for a service becomes the cover. Changeable in dashboard, but never required. | Reduces decision friction at upload time. |
| 4 | **"See N more photos" link only appears when N > 0.** If a service has exactly 1 photo (the cover), no deep dive link is shown — just the cover. | Prevents empty modal opens. |
| 5 | **The Craft Wall grid is unfiltered.** No specialty chips, no sorting controls, no search. It shows a random mix from all services. Its job is premium vibe, not search. | Intentional design decision. Filtering happens implicitly through service-scoped deep dive modals. |
| 6 | **Macro work photography, not selfies.** The Craft Wall displays work output. UI onboarding should guide masters toward work photos ("Show your best balayage results") not self-portraits. | Phase 1 principle P1-CHEF-2: Craft over Face. |

### Identity & Location

| # | Rule | Rationale |
|---|---|---|
| 7 | **Private Master: address hidden until post-booking.** Public page shows only neighborhood + radius (e.g., "Mitte · 10 min от U-Bahn"). Full address, door code, and arrival details are released only after booking confirmation via the Arrival Ritual Card. | Phase 1 principle P1-THERAPIST-5: Arrival Orchestration. Privacy as a premium signal. |
| 8 | **Salon: full address openly visible.** Salons are public establishments. Address is a trust signal, not a privacy concern. | Asymmetric transparency — each type shows what builds trust for their context. |
| 9 | **Private Master bio: first-person voice enforced.** Onboarding UI placeholder text uses first-person singular ("Я специализируюсь на..."). No "our team" language. | Phase 1 principle P1-THERAPIST-4: structural enforcement via UI, not copywriting guidance docs. |

### Booking

| # | Rule | Rationale |
|---|---|---|
| 10 | **Private Master booking: always 1-step.** Tap "Book" → calendar. No intermediary screens. | No staff to route. Friction kills conversion. |
| 11 | **Salon booking: 2-step only when necessary.** Specialist selector modal appears only when multiple specialists offer the service. Auto-skipped for single-specialist services. | Adversarial #6: absurd 1-option modal. |
| 12 | **Photo-to-booking shortcut.** When a visitor taps "Book" from a watermarked photo in a Salon's deep dive modal, the specialist from the watermark is pre-selected. No specialist selector modal. | Reduces steps. Converts visual inspiration into booking with minimum friction. |
| 13 | **No scarcity theater.** No "only 2 slots left" badges, no artificial urgency timers, no "DM for price" gates. Prices are visible. Slots are bookable. | Core brand constraint. Young masters need volume, not artificial exclusivity. |

### Visual Hierarchy

| # | Rule | Rationale |
|---|---|---|
| 14 | **Private Master screen 1 must be visually richer than Salon screen 1.** The Craft Wall grid (60-70% of viewport) ensures Private Master pages are the most visually striking on the platform. Salon screen 1 is informational (logo, address, interior strip). | Adversarial #3: Empty Throne. The concept was built to elevate Private Masters, not demote them. |
| 15 | **Salon specialist cards: no inline thumbnail grids.** Cards show avatar + name + specialty + rating + deep dive link only. Portfolio browsing happens in the modal. | 10 specialists × 6 thumbnails = visual chaos. The deep dive modal keeps the team section clean. |

---

## 8. Design Tokens (Inherited)

These are locked from the Svoi.de brand system. The redesign uses them, does not change them.

| Token | Value | Usage |
|---|---|---|
| `booking-bg` | `#F4EFE6` (warm beige) | Page background |
| `booking-primary` | `#1B2A23` (forest green) | Primary text, CTA backgrounds |
| `booking-card` | white / near-white | Card surfaces |
| Gold accent | `#C2A363` | Borders, links, subtle highlights |
| Typography | Playfair Display (serif) | Headings, master names |
| Shadow system | Neumorphic (soft outer shadow + inner highlight) | Cards, photo tiles, modals |
| Glass effect | Backdrop blur + semi-transparent background | Modal overlays, sticky elements |

---

## 9. Component-to-Entity Matrix

Quick reference for developers — which components render where.

| Component | Private Master Page | Salon Page | Deep Dive Modal | Booking Flow |
|---|---|---|---|---|
| `<EntityHero>` | Screen 1 (craft variant) | Screen 1 (establishment variant) | — | — |
| `<CraftWallGrid>` | Screen 1 (page hero) | Inside specialist modal | Yes (specialist portfolio) | — |
| `<TeamSection>` | — | Screen 2 | — | — |
| `<SpecialistCard>` | — | Inside TeamSection | — | — |
| `<ServiceMenu>` | Screen 2 | Screen 3 | — | — |
| `<ServiceMenuRow>` | Inside ServiceMenu | Inside ServiceMenu | — | — |
| `<DeepDiveModal>` | On "See N more" tap | On "See N more" / specialist tap | — | — |
| `<BookingCTA>` | Hero + service rows + modal | Hero + service rows + modal | "Book this look" | — |
| `<SpecialistSelector>` | — | — | — | Salon 2-step |
| `<ArrivalRitualCard>` | — | — | — | Post-booking confirmation |

---

## 10. API Endpoints (Simplified)

| Endpoint | Returns | Notes |
|---|---|---|
| `GET /api/salon/[slug]` | Full profile + services + staff + photo counts | Public. Omits `arrivalInfo` for Private Masters. |
| `GET /api/salon/[slug]/photos` | `PortfolioPhoto[]` for Craft Wall | Paginated. All photos for profile, random order. |
| `GET /api/salon/[slug]/photos?serviceId=X` | Photos for a specific service | For deep dive modal. Ordered by `position`. |
| `GET /api/salon/[slug]/photos?staffId=Y` | Photos by a specific specialist | For specialist deep dive. All services by that staff. |
| `POST /api/dashboard/services/[id]/photos` | Upload photos to a service | Creates `PortfolioPhoto` records. Auto-assigns cover. |
| `PATCH /api/dashboard/services/[id]/photos/reorder` | Reorder photos / change cover | Swaps `position` values. |
| `GET /api/bookings/[id]/arrival` | `ArrivalRitualCard` data | Authenticated. Only for confirmed bookings on Private Master profiles. |
