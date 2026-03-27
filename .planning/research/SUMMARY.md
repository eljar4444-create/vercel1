# Research Summary: Svoi.de B2B Booking Platform

## Key Findings

**Stack:** The native Next.js + Neon Postgres stack is excellent, but for 1000+ DAU and robust B2B features, it requires a dedicated Background Queue (e.g., Inngest or Upstash) to offload synchronous notifications, and robust timezone libraries (`date-fns-tz`) configured strictly to UTC for DB persistence.

**Table Stakes (Features):** The platform cannot survive without bulletproof real-time slot locking, automated multi-channel notifications (Email/Telegram), and a seamless, dynamic provider setup flow. Custom social feeds or bloated features should be completely avoided in favor of core booking reliability.

**Watch Out For (Pitfalls):** 
1. **Concurrency Bugs:** Double bookings will happen if queries are sequential instead of using explicit DB transaction locks.
2. **Synchronous Hangs:** 3rd-party API calls (emails/notifications) inside user-facing server actions will choke the UI.
3. **Fragile State:** Multi-step provider onboarding will result in corrupted profiles if not governed by a strict backend state machine.
