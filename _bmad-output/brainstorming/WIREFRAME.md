# Svoi.de Homepage V1 — Wireframe Specification

**Status:** Implementation-Ready
**Source:** Brainstorming Session 2026-03-30 (33 ideas, Progressive Flow)
**Brand DNA:** "Свои мастера. Тот самый уровень качества."
**Design Language:** Neumorphism + Glassmorphism + Old Money Aesthetic

---

## 1. Global Design Rules

### 1.1 Color Tokens

Already defined in `tailwind.config.ts` under `booking.*`:

| Token | Hex | Usage |
|-------|-----|-------|
| `booking-bg` | `#EBE6DF` | Page background, warm stone |
| `booking-card` | `#F4F1EC` | Neumorphic card surfaces |
| `booking-primary` | `#2F4B3A` | Forest green — CTAs, manifesto band, accents |
| `booking-primaryHover` | `#243A2C` | Darker green for hover states |
| `booking-textMain` | `#312F2D` | Primary text |
| `booking-textMuted` | `#8A837A` | Secondary/muted text |
| `booking-border` | `#D9D2C7` | Subtle borders |

**Additional tokens needed:**

| Token | Value | Usage |
|-------|-------|-------|
| `booking-manifesto` | `#2F4B3A` | Full-width manifesto band background |
| `booking-glass` | `rgba(255, 255, 255, 0.40)` | Glassmorphism card fill |
| `booking-glassBorder` | `rgba(255, 255, 255, 0.60)` | Glassmorphism card border |

### 1.2 Typography

| Element | Font | Weight | Size (Mobile / Desktop) |
|---------|------|--------|------------------------|
| H1 (Hero) | `font-serif` (Playfair Display) | 800 (extrabold) | `text-4xl` / `text-6xl` |
| H2 (Section) | `font-serif` | 700 (bold) | `text-2xl` / `text-4xl` |
| H3 (Card titles) | `font-sans` (Inter) | 800 (extrabold) | `text-lg` / `text-xl` |
| Body | `font-sans` | 400 | `text-sm` / `text-base` |
| Manifesto line | `font-serif` | 700 | `text-2xl` / `text-4xl` |
| Footer sign-off | `font-serif` | 400 italic | `text-xs` / `text-sm` |

### 1.3 Neumorphic Shadow System

Already defined in `tailwind.config.ts`:

```
shadow-soft-out: 8px 8px 16px rgba(200,193,183,0.6), -8px -8px 16px rgba(255,255,255,0.8)
shadow-soft-in:  inset 4px 4px 8px rgba(200,193,183,0.6), inset -4px -4px 8px rgba(255,255,255,0.8)
shadow-glass:    0 8px 32px 0 rgba(47,75,58,0.1)
```

**Button press interaction rule:**
- Resting state: `shadow-soft-out`
- Active/pressed state: `shadow-soft-in` + `scale-[0.98]`
- Transition: `transition-all duration-100`
- Applies to: City pills, category icons, CTA buttons, all interactive neumorphic elements

### 1.4 Glassmorphism Rules

```css
/* Applied to: Jealousy Card, Order Summary, overlay elements */
background: rgba(255, 255, 255, 0.40);
backdrop-filter: blur(12px);
-webkit-backdrop-filter: blur(12px);
border: 1px solid rgba(255, 255, 255, 0.60);
box-shadow: 0 8px 32px 0 rgba(47, 75, 58, 0.1); /* shadow-glass */
border-radius: 2rem;
```

### 1.5 Corner Radius System

| Element | Radius |
|---------|--------|
| Cards (master, category) | `rounded-[2rem]` |
| Buttons (CTA) | `rounded-full` |
| City pills | `rounded-full` |
| Input fields | `rounded-2xl` |
| Manifesto band | `rounded-none` (full-width) |

---

## 2. Layout: Mobile vs Desktop

### 2.1 Page Background

`bg-booking-bg` (`#EBE6DF`) — warm stone, continuous for all sections except the Hero and Manifesto band.

### 2.2 Desktop Grid (md+ breakpoint)

- Max container width: `max-w-7xl` (1280px)
- Master gallery: `grid-cols-2 lg:grid-cols-3` (2-3 columns)
- Category nav: Horizontal flex row, all items visible
- Manifesto 3-columns: `grid-cols-3`
- Padding: `px-8`

### 2.3 Mobile Layout (< md)

- Master gallery: **Single column, full-bleed cards** — each card takes ~90% viewport width
- Category nav: Horizontal scroll with `overflow-x-auto`, scroll-snap, thumb-swipeable
- Manifesto 3-columns: Stacks to `grid-cols-1` with vertical spacing
- Padding: `px-4`
- Hero H1: `text-4xl` (smaller but still bold)

**Critical mobile rule:** The master card macro-photography must be large and unmissable. Minimum image height: `h-48` on mobile.

---

## 3. The 5 Acts — Section-by-Section Specification

---

### ACT 1: THE HERO — Cultural Gateway

**Purpose:** Establish premium club vibe, declare cultural identity, enable city selection. SEO anchor.

**Height:** `min-h-[70vh]` on desktop, `min-h-[60vh]` on mobile. NOT full-screen — allows Act 2 to peek.

**Background:** `bg-booking-bg` with subtle radial gradient or soft vignette (NO hero image/video in V1 — the design itself is the statement).

**Layout (centered, vertical stack):**

```
┌─────────────────────────────────────────────────┐
│                                                 │
│      Свои мастера.                              │
│      Тот самый уровень качества.                │
│                                                 │
│   Premium beauty masters in deiner Stadt        │
│                                                 │
│   [Berlin] [München] [Hamburg] [Frankfurt]      │
│   [Köln] [Düsseldorf]                          │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Elements:**

1. **H1** — `font-serif text-4xl md:text-6xl font-extrabold text-booking-textMain tracking-tight text-center`
   - Line 1: "Свои мастера."
   - Line 2: "Тот самый уровень качества."
   - Two lines, natural break. Breathing whitespace above and below.

2. **SEO Subtitle** — `font-sans text-base md:text-lg text-booking-textMuted text-center mt-4`
   - "Premium beauty masters in deiner Stadt" (German for SEO)
   - Alternatively: "Finde und buche die besten Beauty-Meister in Deutschland"

3. **City Pills** — Horizontal flex row, centered, `mt-8 flex flex-wrap justify-center gap-3`
   - Each pill: `rounded-full px-5 py-2.5 bg-booking-card shadow-soft-out text-sm font-semibold text-booking-textMain`
   - Active state on tap: `shadow-soft-in scale-[0.98]` (physical button press)
   - On click: Scrolls down to Act 3 (gallery) filtered by selected city, OR navigates to `/search?city={city}`
   - **NO master counts** — just city names. Exclusivity through omission.

---

### ACT 2: THE APPETITE — Category Navigation

**Purpose:** Visual service discovery. Make Alina WANT the service before she searches. Functional navigation.

**Background:** Continuous `bg-booking-bg`. Separated from Hero by `py-8 md:py-12`.

**Layout:**

```
┌─────────────────────────────────────────────────┐
│  [📷 Маникюр] [📷 Брови] [📷 Волосы] [📷 Массаж] [📷 Косметология]  │
└─────────────────────────────────────────────────┘
```

**Elements:**

1. **Section header** (optional, can be omitted for minimalism):
   - `font-serif text-2xl md:text-3xl font-bold text-booking-textMain text-center`

2. **Category scroll container:**
   - Desktop: `flex justify-center gap-6` (all visible, no scroll needed)
   - Mobile: `flex overflow-x-auto gap-4 snap-x snap-mandatory px-4 scrollbar-hide`
   - Each item: `snap-center flex-shrink-0`

3. **Category card (each item):**
   - Size: `w-28 h-36 md:w-36 md:h-44`
   - Container: `rounded-[2rem] bg-booking-card shadow-soft-out flex flex-col items-center justify-center gap-3 cursor-pointer`
   - Image: Macro-photography circle or rounded square, `w-16 h-16 md:w-20 md:h-20 rounded-2xl object-cover`
     - **CRITICAL:** Real macro-photography of the craft — perfect cuticles, flawless brow arch, clean fade. NOT generic icons.
   - Label: `font-sans text-xs md:text-sm font-semibold text-booking-textMain`
   - Active/tap: `shadow-soft-in scale-[0.98]`
   - On click: Navigate to `/search?q={category}`

**Categories for V1:**
- Маникюр (Manicure)
- Педикюр (Pedicure)
- Брови и ресницы (Brows & Lashes)
- Волосы (Hair)
- Массаж (Massage)
- Косметология (Cosmetology)

---

### ACT 3: THE PROOF — Resident Artists Gallery

**Purpose:** Showcase master quality. Convert Alina to book. Convert Marina through aspiration (PLG).

**Background:** Continuous `bg-booking-bg`. `py-12 md:py-16`.

**Section header:**
- `font-serif text-2xl md:text-4xl font-bold text-booking-textMain`
- Text: "Наши мастера" or "Резиденты"

**Layout:**
- Desktop: `grid grid-cols-2 lg:grid-cols-3 gap-6`
- Mobile: `flex flex-col gap-6` — **single column, full-bleed**

**Master Card specification:**

```
┌────────────────────────────────────────┐
│  ┌──────────────────────────────────┐  │
│  │                                  │  │
│  │    [MACRO WORK PHOTO]            │  │
│  │    h-48 md:h-56 object-cover     │  │
│  │                                  │  │
│  └──────────────────────────────────┘  │
│                                        │
│  ✓ Verified Master          ★ 4.9     │
│                                        │
│  Анна Соколова                         │
│  Nail Artist · Berlin                  │
│                                        │
│  Гель-маникюр     от €45 · 90 мин     │
│  Педикюр           от €50 · 60 мин     │
│                                        │
│  [         Записаться          ]       │
│                                        │
└────────────────────────────────────────┘
```

**Card structure:**
- Container: `bg-booking-card rounded-[2rem] shadow-soft-out border border-white/50 overflow-hidden`
- Work photo: `w-full h-48 md:h-56 object-cover rounded-t-[2rem]`
  - **CRITICAL:** This is macro-photography of their WORK, not a headshot. Perfect nails, flawless color, clean lines.
- Content area: `p-5 md:p-6`
- Verified badge: `inline-flex items-center gap-1.5 text-xs font-semibold text-booking-primary`
  - Icon: Shield check or custom verified icon in `booking-primary`
  - Text: "Подтверждённый мастер"
- Rating: `text-xs font-bold text-booking-textMain` — Star icon + number, right-aligned
- Name: `font-sans text-lg font-extrabold text-booking-textMain mt-3`
- Specialty + City: `text-sm text-booking-textMuted mt-1`
- Service rows: `mt-4 space-y-2`
  - Each row: `flex justify-between text-sm`
  - Service name: `text-booking-textMain font-medium`
  - Price + duration: `text-booking-textMuted` — format: "от €XX · XX мин"
  - **CRITICAL:** Exact starting price and duration. NO "DM for price." Radical transparency.
- Book button: `mt-5 w-full rounded-full bg-booking-primary text-white py-3 text-sm font-bold shadow-soft-out`
  - Active: `shadow-soft-in scale-[0.98]`
  - Text: "Записаться" (Book)

---

### ACT 4: THE PLG TROJAN HORSE — Jealousy Card

**Purpose:** Convert providers (Marina) through professional aspiration. Invisible to clients (Alina).

**Placement:** Inserted into the gallery grid **after row 2** (after 4-6 master cards). On desktop: spans full grid width (`col-span-2 lg:col-span-3`). On mobile: appears as a single card in the scroll.

**Visual distinction:** This card uses **Glassmorphism** (not Neumorphism) — it visually breaks the grid pattern to catch the eye.

```
┌─────────────────────────────────────────────────────────┐
│  ╔═══════════════════════════════════════════════════╗  │
│  ║                                                   ║  │
│  ║   Хотите такой же профиль?                        ║  │
│  ║                                                   ║  │
│  ║   Мы — ваш невидимый менеджер.                   ║  │
│  ║   0% комиссии. Навсегда.                         ║  │
│  ║                                                   ║  │
│  ║   [  Создать свою галерею  ]                      ║  │
│  ║                                                   ║  │
│  ╚═══════════════════════════════════════════════════╝  │
└─────────────────────────────────────────────────────────┘
```

**Card structure:**
- Container: `bg-white/40 backdrop-blur-[12px] rounded-[2rem] border border-white/60 shadow-glass p-8 md:p-10`
- **Shimmer effect:** On scroll into viewport (use Intersection Observer), apply a CSS gradient animation:
  ```css
  @keyframes glass-shimmer {
    0%   { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  .jealousy-shimmer {
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(255,255,255,0.15) 50%,
      transparent 100%
    );
    background-size: 200% 100%;
    animation: glass-shimmer 2s ease-in-out 1;
  }
  ```
  Apply the shimmer overlay once when the card enters the viewport. Subtle, not flashy.

- Headline: `font-serif text-2xl md:text-3xl font-bold text-booking-textMain`
  - "Хотите такой же профиль?" (Want a profile like this?)
- Subtext line 1: `font-sans text-base md:text-lg text-booking-textMain mt-3`
  - "Мы — ваш невидимый менеджер." (We are your invisible manager.)
- Subtext line 2: `font-sans text-base md:text-lg font-bold text-booking-primary mt-1`
  - "0% комиссии. Навсегда." (0% commission. Forever.)
- CTA button: `mt-6 rounded-full bg-booking-primary text-white px-8 py-3.5 text-sm font-bold shadow-soft-out`
  - Active: `shadow-soft-in scale-[0.98]`
  - Text: "Создать свою галерею" (Claim your gallery)
  - Links to: `/become-pro`

---

### ACT 5: THE CLOSER — Manifesto + Dual CTA

**Purpose:** Rational reassurance (3 columns) → emotional commitment (manifesto) → audience fork (dual CTA).

#### Part A: Manifesto as How-It-Works (3 Columns)

**Background:** Continuous `bg-booking-bg`. `py-12 md:py-16`.

**Layout:**
- Desktop: `grid grid-cols-3 gap-8`
- Mobile: `grid grid-cols-1 gap-6`

```
┌──────────────────┬──────────────────┬──────────────────┐
│   Выберите       │   Запишитесь     │  Качество        │
│   мастера        │   за 30 секунд   │  по нашим        │
│                  │                  │  стандартам       │
│  Подтверждённые  │  Без переписок.  │  Каждый мастер   │
│  мастера, реаль- │  Без ожидания.   │  проверен.       │
│  ные работы и    │  Мгновенное      │  Каждый отзыв    │
│  прозрачные      │  подтверждение.  │  реален.         │
│  цены.           │  Ваше время      │  Без             │
│                  │  важно.          │  компромиссов.   │
└──────────────────┴──────────────────┴──────────────────┘
```

**Column card structure:**
- Container: `bg-booking-card rounded-[2rem] shadow-soft-out p-8 text-center`
- Title: `font-serif text-xl md:text-2xl font-bold text-booking-textMain`
- Description: `font-sans text-sm md:text-base text-booking-textMuted mt-4 leading-relaxed`

**Column content:**

| Column | Title | Description |
|--------|-------|-------------|
| 1 | "Выберите мастера" | "Подтверждённые мастера, реальные фотографии работ и прозрачные цены." |
| 2 | "Запишитесь за 30 секунд" | "Без переписок. Без ожидания. Мгновенное подтверждение. Ваше время важно." |
| 3 | "Качество по нашим стандартам" | "Каждый мастер проверен. Каждый отзыв реален. Без компромиссов." |

#### Part B: The Cultural Manifesto Band

**Background:** `bg-booking-primary` (`#2F4B3A`) — full viewport width, breaking the container. `py-16 md:py-20`.

**Entrance animation:** Text and CTAs animate in when scrolled into viewport.
- Text: `opacity-0 → opacity-100` + `translateY(20px) → translateY(0)`, duration 600ms, ease-out
- CTAs: Same animation, 300ms delay after text

```
┌─────────────────────────────────────────────────────────────────┐
│ ██████████████████████████████████████████████████████████████  │
│ ██                                                          ██  │
│ ██    Мы не идём на компромиссы. И вы не должны.            ██  │
│ ██                                                          ██  │
│ ██    [ Найти мастера ]    [ Стать мастером ]               ██  │
│ ██                                                          ██  │
│ ██████████████████████████████████████████████████████████████  │
└─────────────────────────────────────────────────────────────────┘
```

**Elements:**

1. **Manifesto line:**
   - `font-serif text-2xl md:text-4xl font-bold text-white text-center`
   - "Мы не идём на компромиссы. И вы не должны."

2. **Dual CTA row:** `mt-8 flex flex-col sm:flex-row justify-center gap-4`

   **CTA 1 — "Найти мастера" (Find Your Master):**
   - `rounded-full bg-white/15 backdrop-blur-sm border border-white/30 text-white px-8 py-4 text-sm font-bold`
   - Hover: `bg-white/25`
   - Links to: `/search`

   **CTA 2 — "Стать мастером" (Become a Master):**
   - `rounded-full bg-white text-booking-primary px-8 py-4 text-sm font-bold`
   - Hover: `bg-white/90`
   - Links to: `/become-pro`

   **Design note:** The "Become a Master" button is SOLID white (higher visual weight) because this is the PLG conversion moment — Marina has scrolled the entire page and this is the final push.

---

### THE FOOTER — Trust & Roots

**Background:** `bg-booking-textMain` (`#312F2D`) or `bg-slate-950`. `py-8`.

**Layout:** Simple centered stack. Hyper-minimal.

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   Правовая информация · Политика конфиденциальности · Instagram │
│                                                                 │
│           Designed in Europe. Built for our standards.           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Elements:**

1. **Links row:** `flex justify-center gap-6 text-xs text-white/50`
   - "Правовая информация" (Legal) → `/legal`
   - "Политика конфиденциальности" (Privacy) → `/privacy`
   - Instagram icon → external link to Svoi.de Instagram

2. **Sign-off line:** `font-serif italic text-xs md:text-sm text-white/30 text-center mt-4`
   - "Designed in Europe. Built for our standards."

**Design note:** This sign-off bookends the Hero. Hero opens with "Тот самый уровень качества." Footer closes with "Built for our standards." Same promise, completing the narrative arc.

---

## 4. V2 Backlog (Captured, Not Implemented)

Ideas from brainstorm explicitly deferred to V2+:

| Idea | Version | Why Deferred |
|------|---------|--------------|
| Master count on city pills | V2 | Negative social proof until critical mass |
| Real-time gallery signals ("Lana got a review 12min ago") | V2 | Too heavy for V1, needs traction data |
| Jealousy Card with real stats ("47 clients in 3 weeks") | V2 | Needs real provider success stories |
| Return visit personalization (filtered by last search) | V2 | Requires user behavior tracking |
| Micro-sound on button press (luxury car door click) | V3 | Brand polish, not core experience |
| Scroll progress indicator | V2 | Nice-to-have, not conversion-critical |

---

## 5. Implementation Notes

### Component Mapping (Next.js / React)

| Section | Suggested Component | Notes |
|---------|-------------------|-------|
| Act 1 | `<HomeHero />` | Replace existing hero — remove search bar, video, stats |
| Act 2 | `<CategoryNav />` | New component, horizontal scroll with snap |
| Act 3 | `<MasterGallery />` | Refactor `<TopMastersSection />` with new card design |
| Act 4 | `<JealousyCard />` | New component, glassmorphism + shimmer |
| Act 5a | `<HowItWorks />` | New component, 3-column neumorphic |
| Act 5b | `<ManifestoBand />` | New component, full-width green band |
| Footer | `<Footer />` | New or refactored, hyper-minimal |

### Scroll Animations

Use existing `<ScrollReveal />` component for fade-in-on-scroll behavior. Add special entrance animation only for the Manifesto Band (Act 5b).

### SEO Considerations

- H1 is in Russian (cultural identity) — German subtitle provides SEO anchor
- Each city pill can link to `/search?city=Berlin` for crawlable city landing pages
- Category cards link to `/search?q=Маникюр` for crawlable service pages
- Master cards should use semantic HTML with structured data (LocalBusiness / BeautySalon schema)

---

*Generated from Carson's Brainstorming Session — 33 ideas distilled into 1 blueprint.*
*"Мы не идём на компромиссы. И вы не должны."*
