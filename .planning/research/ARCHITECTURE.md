# Research: Architecture for Booking Platform

## Component Boundaries
- **Inventory & Reservations (Core Engine):** Must be strictly separated from basic CRUD operations. This component manages time slots, duration offsets (padding), and locking mechanism (e.g., Row-Level Security in Postgres or Transaction Isolation).
- **Notification Bus:** A distinct architectural layer (queue/worker) responsible for firing emails, SMS, and Telegram updates based on State events (e.g., Booking Created, Booking Cancelled).
- **Provider Setup State Machine:** A backend-enforced workflow that ensures a provider profile cannot be listed publicly until all required nodes (location, services, schedule, gallery) are fully populated and valid.

## Data Flow
- **Booking Flow:** App -> Server Action -> Validation (Zod) -> DB Transaction Start -> Slot Lock Attempt -> Create Booking -> Commit -> Queue Async Notification (Inngest/Upstash) -> Return Success -> Client Redirects.

## Build Order Implications
1. The **Inventory Engine and Double-Booking Prevention** must be built *before* any public booking UI is exposed.
2. The **Async Queue** must be operational before automated notifications are wired up, to avoid blocking the user thread.
3. The **Provider Setup Flow** dictates what data is available, so its state machine must be built early to ensure data integrity.
