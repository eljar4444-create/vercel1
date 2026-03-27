## Requirements

### Validated

- ✓ Basic Next.js 14 routing and Server Actions structure — existing
- ✓ Prisma Schema with Neon Postgres integration — existing
- ✓ NextAuth.js User and Provider authentication flow — existing

### Active

#### Core Engine (CORE)
- [ ] **CORE-01**: Implement strict Database-level slot locking (transaction isolation or RLS) to prevent double bookings during concurrent checkouts.
- [ ] **CORE-02**: Build a highly-optimized Provider Availability API that avoids sequential database `Promise.all` loops.
- [ ] **CORE-03**: Normalize all schedule/time data to strictly use UTC and robust timezone libraries (`date-fns-tz`) when returning to the client.

#### Infrastructure & Async (INFR)
- [ ] **INFR-01**: Integrate a serverless background queue (e.g., Inngest or Upstash) for non-blocking server actions.
- [ ] **INFR-02**: Create an async worker for reliable Email confirmation/cancellation notifications.
- [ ] **INFR-03**: Create an async worker for instant Telegram alerts to providers upon new bookings.

#### Provider Onboarding (ONBD)
- [ ] **ONBD-01**: Implement a backend State Machine pattern to govern the complex provider setup flow strictly.
- [ ] **ONBD-02**: Ensure the system prevents public visibility of any provider until their state machine reaches the 'PUBLISHED' state.
- [ ] **ONBD-03**: Build a frictionless, optimistic-UI frontend onboarding wizard that maps seamlessly to the backend state machine.

### Out of Scope

- [Fragile UI hacks] — We are strictly building for 1000+ DAU scale; shortcuts are rejected.
- [Cookie tracking] — Must remain 100% Cookieless and GDPR compliant.
- [Custom Social Feeds] — Not a social network. Focus strictly on B2B SaaS scheduling mechanics.

## Traceability

| ID | Phase | Title |
|----|-------|-------|
| CORE-01 | Phase 1 | DB-level slot locking |
| CORE-02 | Phase 1 | Optimized Availability API |
| CORE-03 | Phase 1 | UTC Data Normalization |
| INFR-01 | Phase 2 | Background queue integration |
| INFR-02 | Phase 2 | Async Email worker |
| INFR-03 | Phase 2 | Async Telegram worker |
| ONBD-01 | Phase 3 | Backend Onboarding State Machine |
| ONBD-02 | Phase 3 | Publishing strict enforcement |
| ONBD-03 | Phase 3 | Optimistic UI Onboarding Wizard |
