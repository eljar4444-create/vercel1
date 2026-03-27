# Research: B2B Booking SaaS Pitfalls

## 1. Concurrency Disasters (The "Race Condition")
- **The Pitfall:** Two clients clicking "Book" on the exact same 2:00 PM slot at exactly the same time. If the backend just does a `SELECT` then an `INSERT`, both succeed.
- **Warning Signs:** Relying on `Promise.all()` or separate sequential Prisma queries for availability checks during checkout.
- **Prevention Strategy:** Use Prisma's `$transaction` with explicit locking or `SERIALIZABLE` isolation level, or build a robust `Inventory` model with unique time constraints.
- **Phase to Address:** Schedule Management Core Phase.

## 2. Bloated Synchronous Workflows
- **The Pitfall:** Putting Stripe API calls, Email sending (Resend/Sendgrid), and Telegram bot pings in the same Next.js Server Action as the database insert. If Telegram is slow, the user's browser hangs for 5 seconds.
- **Warning Signs:** Heavy `await` chains calling multiple third-party APIs in a user-facing action.
- **Prevention Strategy:** Introduce a serverless queue. The Server Action only inserts the DB record and fires an event to the queue. The queue handles the integration calls asynchronously.
- **Phase to Address:** Notifications & Infrastructure Phase.

## 3. Fragile Multi-Step Forms
- **The Pitfall:** Onboarding requires 5 complex steps. If the user refreshes on step 3, data is lost, or they end up in a corrupted state where they are half-provider, half-user.
- **Prevention Strategy:** Backend-first state tracking. The server knows exactly what step the user is on and what fields are missing, and strictly redirects until satisfied.
- **Phase to Address:** Provider Setup Phase.
