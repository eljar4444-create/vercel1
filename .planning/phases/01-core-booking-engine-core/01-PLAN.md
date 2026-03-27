---
wave: 1
depends_on: []
files_modified:
  - prisma/schema.prisma
  - src/lib/services/booking/availability.ts
  - src/lib/utils/time.ts
  - src/app/actions/booking.ts
auto_advance: true
---

# Phase 1 Plan: Core Booking Engine

<objective>
Implement strict database-level slot locking, optimize the Availability API, and normalize all schedule data to UTC.
</objective>

<requirements>
CORE-01, CORE-02, CORE-03
</requirements>

<tasks>
<task>
<description>
Update Prisma Schema to enforce strict double-booking prevention at the database level.
</description>
<read_first>
- prisma/schema.prisma
- .planning/REQUIREMENTS.md
</read_first>
<action>
1. Identify the `Booking` model in `prisma/schema.prisma`.
2. Add a `@@unique` compound constraint for `[profile_id, staff_id, date, time]`. If `staff_id` is null (optional), Prisma unique constraints might need a raw SQL partial index or a separate locking table if nullable fields cause issues. For our phase, we'll design a `TimeSlotLock` model or use an explicit `$transaction` with row-level locks on the `Profile`/`Staff` during booking creation. Let's stick to wrapping the booking creation in a strict `$transaction` block that reads the slot inventory and inserts only if empty in a serializable or read committed isolated transaction. Wait, the exact database mechanism will be determined during execution, but the target state is that the database rejects the second concurrent booking.
</action>
<acceptance_criteria>
- `prisma/schema.prisma` contains the new unique constraints or lock models.
- Database migration script created.
</acceptance_criteria>
</task>

<task>
<description>
Implement UTC Date normalization and Time utilities.
</description>
<read_first>
- src/lib/utils/time.ts (needs to be created)
- package.json
</read_first>
<action>
Create `src/lib/utils/time.ts` exporting functions relying strictly on `date-fns-tz` to translate incoming client local times to UTC for DB storage, and translating DB UTC records seamlessly into the profile's timezone.
</action>
<acceptance_criteria>
- `src/lib/utils/time.ts` exists and exposes `toUTC` and `toZonedTime`.
</acceptance_criteria>
</task>

<task>
<description>
Implement highly optimized `getProviderAvailability` service.
</description>
<read_first>
- src/lib/services/booking/availability.ts
</read_first>
<action>
Create the `getProviderAvailability` function that reads a provider's profile schedule (JSON) and executes exactly ONE Prisma query to fetch all bookings in a given date range. Merge the schedule slots with the bookings via Map lookups in memory (O(n) complexity) instead of sequential DB queries.
</action>
<acceptance_criteria>
- Function fetches bookings using a single `<WHERE date GTE startDate AND date LTE endDate>` array query.
- No `Promise.all` loops calling the database for each day.
</acceptance_criteria>
</task>

<task>
<description>
Refactor Booking Server Action.
</description>
<read_first>
- src/app/actions/booking.ts (or equivalent)
</read_first>
<action>
Refactor the checkout/booking action to wrap the validation and `Booking.create` call inside a `prisma.$transaction`. Check if slot is available; if yes, insert booking. If Prisma throws an error or the slot is taken midway, return `{ error: "Slot already taken" }`.
</action>
<acceptance_criteria>
- The booking action contains `prisma.$transaction`.
- Catches potential concurrency collisions gracefully.
</acceptance_criteria>
</task>
</tasks>

<must_haves>
- Double bookings MUST physically fail via DB enforcement.
- Availability MUST be calculated in memory after a single sequential read.
- Time conversions MUST be driven by `date-fns-tz`.
</must_haves>
