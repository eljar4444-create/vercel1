---
wave: 1
depends_on: []
files_modified:
  - package.json
  - src/inngest/client.ts
  - src/app/api/inngest/route.ts
  - src/inngest/functions/booking.ts
  - src/app/actions/booking.ts
auto_advance: true
---

# Phase 2 Plan: Infrastructure & Background Jobs

<objective>
Integrate Inngest serverless background queue to handle heavy third-party workflows (Email & Telegram) asynchronously avoiding main thread blocking.
</objective>

<requirements>
INFR-01, INFR-02, INFR-03
</requirements>

<tasks>
<task>
<description>
Install Inngest SDK and instantiate global client
</description>
<read_first>
- package.json
- src/inngest/client.ts (to be created)
</read_first>
<action>
1. Add `inngest` to dependencies.
2. Create `src/inngest/client.ts` exporting an instantiated Inngest client with the project name "Svoi".
</action>
<acceptance_criteria>
- `package.json` contains `inngest` dependency.
- `src/inngest/client.ts` exports `inngest`.
</acceptance_criteria>
</task>

<task>
<description>
Setup Inngest API Route Handler
</description>
<read_first>
- src/app/api/inngest/route.ts (to be created)
</read_first>
<action>
Create the Next.js App Router API endpoint at `src/app/api/inngest/route.ts` using `serve` from `inngest/next`. Serve the client and any exported functions array (initially empty or containing the booking function below).
</action>
<acceptance_criteria>
- `route.ts` correctly exposes GET, POST, and PUT handlers.
</acceptance_criteria>
</task>

<task>
<description>
Create async booking notification worker
</description>
<read_first>
- src/inngest/functions/booking.ts (to be created)
- src/lib/telegram.ts
</read_first>
<action>
Create `src/inngest/functions/booking.ts` with a function `sendBookingNotifications` listening for `booking/created` event. Inside the step function:
1. `step.run` to fetch booking and profile details securely from DB.
2. `step.run` to fire `sendTelegramMessage` to the provider.
(Prepare placeholder for email).
</action>
<acceptance_criteria>
- Function correctly uses `inngest.createFunction`.
- It executes Telegram API via `step.run` safely.
</acceptance_criteria>
</task>

<task>
<description>
Refactor `booking.ts` action to use Inngest
</description>
<read_first>
- src/app/actions/booking.ts
</read_first>
<action>
Replace the synchronous `sendTelegramMessage` await block with:
`await inngest.send({ name: 'booking/created', data: { bookingId: booking.id } });`
Remove the explicit DB fetch for the provider's Telegram token inside the UI thread.
</action>
<acceptance_criteria>
- `src/app/actions/booking.ts` imports `inngest`.
- No `sendTelegramMessage` blocking call remains.
</acceptance_criteria>
</task>
</tasks>

<must_haves>
- The UI thread must return <50ms after DB insert without waiting for Telegram to resolve.
- Inngest client must be properly exported and API route must serve it.
</must_haves>
