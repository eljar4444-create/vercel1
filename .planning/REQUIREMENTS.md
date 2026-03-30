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

#### Homepage V1 PLG Engine (HOME)
- [ ] **HOME-01**: Extend Tailwind tokens — glassmorphism colors, shimmer/manifesto keyframes, neumorphic utility classes (btn-neu, glass-card).
- [ ] **HOME-02**: Hero section — Cultural H1 in Playfair Display, German SEO subtitle, neumorphic city pills without counts.
- [ ] **HOME-03**: Category navigation — Horizontal scroll with macro-photography, snap scrolling on mobile, neumorphic card press.
- [ ] **HOME-04**: Master gallery — Neumorphic cards with verified badge, macro work photo, transparent pricing (€ + min), Book CTA.
- [ ] **HOME-05**: Jealousy Card — Glassmorphism PLG card after gallery row 2, shimmer on viewport entry, provider conversion copy.
- [ ] **HOME-06**: How-It-Works — 3-column neumorphic manifesto-as-mechanics section.
- [ ] **HOME-07**: Manifesto Band + Footer — Full-width forest green closer with entrance animation, dual CTAs, hyper-minimal footer.

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
| HOME-01 | Phase 3.2 | Tailwind design token extensions |
| HOME-02 | Phase 3.2 | Cultural Hero section |
| HOME-03 | Phase 3.2 | Category navigation |
| HOME-04 | Phase 3.2 | Resident Artists gallery |
| HOME-05 | Phase 3.2 | PLG Jealousy Card |
| HOME-06 | Phase 3.2 | How-It-Works manifesto section |
| HOME-07 | Phase 3.2 | Manifesto Band + Footer |
