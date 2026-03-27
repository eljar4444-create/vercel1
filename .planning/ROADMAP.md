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

## Future / Unplanned
- (None yet)
