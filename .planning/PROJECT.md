# Svoi.de

## What This Is
Svoi.de is a B2B SaaS online booking platform for beauty professionals (solo masters and salons) in Germany. The primary target audience currently includes Ukrainian expat beauty masters integrating into the German market.

## Core Value
A highly polished, robust, and production-grade booking platform designed to provide a frictionless user experience and handle 1000+ DAU from day one without performance bottlenecks or data conflicts.

## Requirements

### Validated
- ✓ Next.js 14 App Router foundation with server actions — existing
- ✓ Prisma ORM with Neon Serverless PostgreSQL — existing
- ✓ NextAuth.js configured with Google, Apple, and Email — existing
- ✓ Database schema ready for DAC7 compliance, Stripe B2B billing, and Profiles — existing
- ✓ 100% Cookieless & GDPR Compliant baseline — existing

### Active
- [ ] Implement robust schedule management with bulletproof double-booking prevention.
- [ ] Build a flawless, high-conversion provider onboarding and setup flow.
- [ ] Implement automated notification and booking lifecycle systems (reminders, confirmations).

### Out of Scope
- [Fragile MVP features] — We are explicitly skipping "quick and dirty" MVP shortcuts in favor of robust, production-grade architecture.
- [Non-essential tracking cookies] — Strictly avoided to maintain 100% Cookieless and GDPR compliance.

## Context
- **Target Audience:** Ukrainian expat beauty professionals in Germany.
- **Standards:** Legal and Tax ready (DAC7, Stripe).
- **Architecture Philosophy:** High-performance, minimalist UI, reliable data flow. Historical performance issues (Mobile LCP, Sequential DB queries) must be actively avoided.
- **Current State:** The foundational architecture (auth, database schema, routing) is present, but core business workflows (bulletproof booking, robust scheduling, background jobs) need implementation.

## Constraints
- **Performance**: Must smoothly handle 1000+ DAU from day one without bottlenecks.
- **Compliance**: Must be strictly GDPR compliant and 100% cookieless.
- **Quality**: Must be highly polished and frictionless; no fragile MVP code.
- **Infrastructure**: Vercel Edge compute and Neon Serverless Postgres.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Next.js App Router | Provides React Server Components for optimized data fetching and rendering. | ✓ Good |
| Neon Serverless | Scales well with serverless edge functions and Next.js integration. | ✓ Good |

## Evolution
This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-27 after initialization*
