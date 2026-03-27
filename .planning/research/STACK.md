# Research: Specialized Stack for B2B Booking SaaS

Based on the goal of a highly polished, production-grade booking platform handling 1000+ DAU simultaneously, here is the recommended stack evolution built upon the existing Next.js/Prisma foundation.

## Standard Stack Additions (2025)

**1. Background Jobs & Queueing (Critical)**
- **Recommendation:** `Inngest` or `Upstash QStash`
- **Rationale:** A synchronous request lifecycle in Next.js Server Actions is too fragile for email confirmations, Telegram pings, and payment syncs. A dedicated serverless queue ensures retries and decouples the critical path.
- **Confidence:** High (Table-stakes for this scale).

**2. State Management for Complex Workflows**
- **Recommendation:** `xstate` (for backend or complex frontend onboarding)
- **Rationale:** Provider onboarding is complex (basic info, services, gallery, location, verification). An ad-hoc `step` integer leads to bad UX and bugs. A state machine guarantees users only see what they should and cannot bypass required data.
- **Confidence:** High.

**3. Advanced Timezone & Date Handling**
- **Recommendation:** Native `date-fns-tz` + strictly UTC database storage.
- **Rationale:** German/Ukrainian overlaps require impeccable timezone handling. Booking logic fails spectacularly if timezones are mismanaged.
- **Confidence:** Absolute. Do not use generic string formats.

## What NOT to Use
- **In-memory state or standard generic queues (Redis BullMQ) on Vercel:** Since Vercel is serverless, traditional long-running Node.js queues (like Bull) do not work reliably unless deployed to a persistent server. Use serverless-native queues (Inngest/Upstash).
