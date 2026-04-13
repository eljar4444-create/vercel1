# Story 1.2: Add Staff.specialty and Profile.arrivalInfo Fields

Status: done

## Story

As a developer,
I want `Staff.specialty` (String?) and `Profile.arrivalInfo` (Json?) fields added to the Prisma schema,
so that specialist cards can show roles (e.g., "Колорист") and Private Masters can store post-booking arrival details.

## Acceptance Criteria

1. **AC-001:** `Staff.specialty` field exists as `String?` (optional) in `prisma/schema.prisma`
2. **AC-002:** `Profile.arrivalInfo` field exists as `Json?` (optional) in `prisma/schema.prisma`
3. **AC-003:** `arrivalInfo` JSON structure documented in a code comment: `{ address: string, doorCode?: string, bellNote?: string, waitingSpot?: string }`
4. **AC-004:** Migration runs successfully against existing database with zero data loss — additive ALTER TABLE only
5. **AC-005:** `npx prisma generate` completes without errors — Prisma Client includes both new fields
6. **AC-006:** Existing tests pass — zero regressions (17 files, 139 tests as of Story 1.1)

## Tasks / Subtasks

- [x] Task 1: Add `specialty` field to Staff model (AC: 001)
  - [x] 1.1: Add `specialty String?` to Staff model — line 183
- [x] Task 2: Add `arrivalInfo` field to Profile model (AC: 002, 003)
  - [x] 2.1: Add `arrivalInfo Json?` to Profile model — line 67
  - [x] 2.2: Two-line code comment added above field documenting JSON structure
- [x] Task 3: Generate migration and apply (AC: 004, 005)
  - [x] 3.1: SQL generated via `prisma migrate diff`: 2 additive ALTER TABLEs
  - [x] 3.2: Migration file created at `prisma/migrations/20260412130000_add_staff_specialty_arrival_info/migration.sql`
  - [x] 3.3: Applied via `prisma db push` — database synced
  - [x] 3.4: `prisma generate` succeeded — both fields confirmed in Prisma Client
- [x] Task 4: Verify no regressions (AC: 006)
  - [x] 4.1: 17 files, 139 tests — all pass

## Dev Notes

### Exact Schema Changes

**In `Staff` model** (after `schedule Json?`, currently line ~182 in `prisma/schema.prisma`):
```prisma
  specialty String?
```

**In `Profile` model** (after `outcallRadiusKm Int?`, currently line ~62):
```prisma
  // Arrival info for Private Masters — revealed post-booking only
  // JSON structure: { address: string, doorCode?: string, bellNote?: string, waitingSpot?: string }
  arrivalInfo  Json?
```

### Placement Rationale

- `Staff.specialty` goes with the identity fields (`name`, `avatarUrl`, `bio`) — it describes what the specialist does (e.g., "Колорист", "Стилист"). Placed after `schedule` to keep data fields together before timestamps.
- `Profile.arrivalInfo` goes with the location fields (`address`, `latitude`, `longitude`) area. Placed after `outcallRadiusKm` in the service-mode block since it's related to how clients reach the master.

### Previous Story Intelligence (from Story 1.1)

- **Shadow DB workaround required:** `prisma migrate dev` fails due to pre-existing migration history issue. Use `prisma migrate diff --from-schema-datasource --to-schema-datamodel --script` to generate SQL, create migration file manually, apply via `prisma db push`.
- **Migration naming convention:** `YYYYMMDDHHMMSS_descriptive_name`
- **Schema file:** `prisma/schema.prisma` (single file)
- **Prisma version:** 5.22.0
- **Current test baseline:** 17 files, 139 tests, 0 failures

### Anti-Patterns to Avoid

- **DO NOT** modify any existing fields — only add the two new fields
- **DO NOT** add default values for these fields — both are nullable and should be `null` for all existing records
- **DO NOT** add API routes for reading/writing these fields — that's Story 1.4
- **DO NOT** add indexes for these fields — they are not queried directly (arrivalInfo is fetched as part of a Profile record; specialty is fetched as part of a Staff record)

### Verification Commands

```bash
npx prisma validate
npx prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --script
npx prisma db push
npx prisma generate
npx vitest run
```

### References

- [Source: _bmad-output/BLUEPRINT-salon-slug-redesign.md#4.3 — Staff Model Enhancement]
- [Source: _bmad-output/BLUEPRINT-salon-slug-redesign.md#4.4 — Profile Model — Arrival Info]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.2]
- [Source: _bmad-output/implementation-artifacts/1-1-create-portfoliophoto-model.md — previous story learnings]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (Amelia persona, BMAD dev-story workflow)

### Debug Log References

- Shadow DB workaround reused from Story 1.1 — no issues.

### Completion Notes List

- `Staff.specialty` (String?) added — for specialist role display on cards (e.g., "Колорист")
- `Profile.arrivalInfo` (Json?) added — for Private Master post-booking address reveal
- JSON structure documented inline: `{ address, doorCode?, bellNote?, waitingSpot? }`
- Migration SQL: 2 additive ALTER TABLEs (ADD COLUMN only)
- All 6 ACs satisfied
- Zero regressions: 17/17 files, 139/139 tests

### Change Log

- 2026-04-12: Story 1.2 implemented — Staff.specialty + Profile.arrivalInfo fields
- 2026-04-12: Code review passed — all 6 ACs verified, no patches required

### Review Findings

- [x] [Review][Defer] JSON shape runtime validation — Story 1.4 API layer
- [x] [Review][Defer] `arrivalInfo` PII access control — Epic 4 page layout scope
- [x] [Review][Defer] `specialty` free-form typo risk — intentional per Blueprint flexibility

### File List

- `prisma/schema.prisma` — modified (added `specialty` to Staff, added `arrivalInfo` + comments to Profile)
- `prisma/migrations/20260412130000_add_staff_specialty_arrival_info/migration.sql` — created
