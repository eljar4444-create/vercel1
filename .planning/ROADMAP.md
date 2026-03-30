# Svoi.de Roadmap

## Active Phases

### Phase 1: Core Booking Engine (CORE)
**Goal:** Implement robust schedule management with bulletproof double-booking prevention.

**Requirements:**
- CORE-01: Implement strict Database-level slot locking (transaction isolation or RLS).
- CORE-02: Build highly-optimized Provider Availability API avoiding sequential database loops.
- CORE-03: Normalize all schedule/time data to strictly use UTC with `date-fns-tz`.

**Success Criteria:**
1. Concurrent booking attempts for the same slot strictly fail for the second user, leaving no corrupted state.
2. The Availability API returns a week's availability for a provider in <200ms.
3. Timezones correctly render for German and Ukrainian users strictly driven by UTC database dates.

---

### Phase 2: Infrastructure & Background Jobs (INFR)
**Goal:** Introduce asynchronous workers to handle heavy third-party workflows reliably.

**Requirements:**
- INFR-01: Integrate a serverless background queue (e.g., Inngest or Upstash QStash).
- INFR-02: Create an async worker for reliable Email notifications.
- INFR-03: Create an async worker for instant Telegram alerts to providers.

**Success Criteria:**
1. Booking Server Actions complete in <100ms by purely dispatching an event to the queue.
2. Email and Telegram notifications are reliably delivered via the async worker even if the main Next.js edge function has returned.
3. Failed notifications automatically retry without user intervention.

---

### Phase 3: Provider Onboarding Flow (ONBD)
**Goal:** Build a flawless, high-conversion provider onboarding wizard governed by a strict backend state machine.

**Requirements:**
- ONBD-01: Implement a backend State Machine tracking exactly where the provider is in their setup flow.
- ONBD-02: Enforce strict gatekeeping; a profile cannot be public until the state machine hits 'PUBLISHED'.
- ONBD-03: Create the UI wizard components mirroring the backend states with optimistic UI.

**Success Criteria:**
1. Providers can safely exit the flow at any step and perfectly resume where they left off.
2. Direct API hits to publish an incomplete profile are strictly rejected by the server side state machine.
3. The UI feels instant and frictionless.

---

### Phase 3.2: Homepage V1 — PLG Engine (HOME)
**Goal:** Rebuild the homepage as a premium, dual-audience PLG conversion engine following the WIREFRAME.md specification. The homepage must convert B2C clients to book AND B2B providers to onboard — through a single unified experience.

**Requirements:**
- HOME-01: Extend Tailwind design tokens with glassmorphism variables, shimmer/manifesto keyframes, and neumorphic utility classes.
- HOME-02: Build Hero section with cultural H1 ("Свои мастера. Тот самый уровень качества."), German SEO subtitle, and neumorphic city pills.
- HOME-03: Build horizontal-scroll category navigation with macro-photography service cards.
- HOME-04: Build Resident Artists gallery with neumorphic master cards showing verified badges, macro work photos, transparent pricing (exact price + duration), and Book CTAs.
- HOME-05: Build Glassmorphism Jealousy Card (PLG Trojan Horse) inserted after row 2 of gallery with provider conversion copy and shimmer animation.
- HOME-06: Build 3-column "Manifesto as How-It-Works" section with neumorphic cards.
- HOME-07: Build full-width forest green Manifesto Band with entrance animation, cultural manifesto line, and dual CTAs (Find Master / Become Master).

**Success Criteria:**
1. Homepage renders the complete 5-Act scroll story from WIREFRAME.md with zero old sections remaining.
2. Mobile-first: single-column gallery, thumb-swipeable category scroll, responsive manifesto.
3. All neumorphic buttons use shadow-soft-out → shadow-soft-in press interaction.
4. JealousyCard uses glassmorphism visual distinction and shimmer fires once on viewport entry.
5. Build passes with zero errors and page loads under 3s on mobile.

---

## Future / Unplanned
- (None yet)
