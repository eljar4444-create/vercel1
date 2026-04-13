# Story 1.1: Create PortfolioPhoto Prisma Model

Status: done

## Story

As a developer,
I want a `PortfolioPhoto` model with relations to Profile, Service, and Staff,
so that photos can be queried by service, by specialist, or globally for the Craft Wall grid.

## Acceptance Criteria

1. **AC-001:** `PortfolioPhoto` model exists in `prisma/schema.prisma` with all required fields (see schema below)
2. **AC-002:** Cascade delete from Profile. SetNull from Service and Staff on delete.
3. **AC-003:** Indexes on `profileId`, `serviceId`, `staffId`, and composite `[profileId, serviceId]`
4. **AC-004:** Reverse relations added to `Profile` (`photos PortfolioPhoto[]`), `Service` (`photos PortfolioPhoto[]`), and `Staff` (`photos PortfolioPhoto[]`)
5. **AC-005:** Prisma migration runs successfully against existing database with zero data loss
6. **AC-006:** `npx prisma generate` completes without errors — Prisma Client includes the new model
7. **AC-007:** Existing models (`Profile`, `Service`, `Staff`, `Booking`, etc.) remain untouched except for the new relation fields

## Tasks / Subtasks

- [x] Task 1: Add `PortfolioPhoto` model to schema (AC: 001, 003)
  - [x] 1.1: Add the model definition with all fields
  - [x] 1.2: Add all four indexes
- [x] Task 2: Add reverse relations to existing models (AC: 004)
  - [x] 2.1: Add `photos PortfolioPhoto[]` to `Profile` model
  - [x] 2.2: Add `photos PortfolioPhoto[]` to `Service` model
  - [x] 2.3: Add `photos PortfolioPhoto[]` to `Staff` model
- [x] Task 3: Generate and apply migration (AC: 005, 006)
  - [x] 3.1: Migration SQL generated via `prisma migrate diff` and applied via `prisma db push` (shadow DB issue with pre-existing migration history required this approach)
  - [x] 3.2: Migration SQL verified additive — 1 CREATE TABLE, 4 CREATE INDEX, 3 ADD CONSTRAINT (all on PortfolioPhoto). Zero changes to existing tables.
  - [x] 3.3: `prisma generate` succeeded. `PrismaClient.portfolioPhoto` confirmed present.
- [x] Task 4: Verify no regressions (AC: 007)
  - [x] 4.1: Full test suite: 17 files, 139 tests — all pass. Zero regressions.

## Dev Notes

### Exact Schema to Add

Add this model to `prisma/schema.prisma` (insert after the `Staff` model block, line ~188):

```prisma
model PortfolioPhoto {
  id        String   @id @default(cuid())
  url       String
  profileId Int
  serviceId Int?
  staffId   String?
  position  Int      @default(0)
  createdAt DateTime @default(now())

  profile   Profile  @relation(fields: [profileId], references: [id], onDelete: Cascade)
  service   Service? @relation(fields: [serviceId], references: [id], onDelete: SetNull)
  staff     Staff?   @relation(fields: [staffId], references: [id], onDelete: SetNull)

  @@index([profileId])
  @@index([serviceId])
  @@index([staffId])
  @@index([profileId, serviceId])
}
```

### Reverse Relations to Add

These are **one-line additions** to three existing models. Do NOT modify any existing fields.

**In `Profile` model** (after `telegramTokens TelegramToken[]`, line ~83):
```prisma
  photos    PortfolioPhoto[]
```

**In `Service` model** (after `bookings Booking[]`, line ~97):
```prisma
  photos    PortfolioPhoto[]
```

**In `Staff` model** (after `bookings Booking[]`, line ~186):
```prisma
  photos    PortfolioPhoto[]
```

### Field Design Rationale

| Field | Type | Why |
|---|---|---|
| `id` | `String @id @default(cuid())` | Matches `Staff`, `Conversation`, `Message`, `Review` — the project uses cuid for non-autoincrement IDs |
| `url` | `String` | Stores the image URL (same as current `Service.images` String[] entries) |
| `profileId` | `Int` | FK to `Profile.id` (Int autoincrement) — every photo belongs to exactly one profile |
| `serviceId` | `Int?` | FK to `Service.id` — nullable for interior/vibe photos (Salon) or unassigned photos |
| `staffId` | `String?` | FK to `Staff.id` (String cuid) — nullable for Private Master photos (no staff) |
| `position` | `Int @default(0)` | Ordering within a service. `0` = cover photo. Higher = deeper in gallery. |
| `createdAt` | `DateTime @default(now())` | Standard timestamp, matches project convention |

### Cascade/SetNull Rules

- **Profile → PortfolioPhoto:** `onDelete: Cascade` — if a profile is deleted, all its photos go too. Matches `Staff`, `Review`, `Favorite` pattern in this project.
- **Service → PortfolioPhoto:** `onDelete: SetNull` — if a service is deleted, photos survive but become unassigned (`serviceId` nulled). The Craft Wall grid still shows them.
- **Staff → PortfolioPhoto:** `onDelete: SetNull` — if a staff member is removed, photos survive but lose attribution. Same reasoning.

### Index Design

| Index | Query it serves |
|---|---|
| `@@index([profileId])` | Craft Wall: `WHERE profileId = X` (all photos for a profile) |
| `@@index([serviceId])` | Deep Dive: `WHERE serviceId = Y` (all photos for a service) |
| `@@index([staffId])` | Specialist portfolio: `WHERE staffId = Z` |
| `@@index([profileId, serviceId])` | Cover photo lookup: `WHERE profileId = X AND serviceId = Y ORDER BY position LIMIT 1` |

### Project Structure Notes

- **Schema file:** `prisma/schema.prisma` (single file, not sharded)
- **Prisma Client singleton:** `src/lib/prisma.ts` — standard global singleton pattern
- **Migration naming convention:** `YYYYMMDDHHMMSS_descriptive_name` (see existing: `20260317193000_add_profile_service_modes`)
- **Auth pattern:** NextAuth v5 with JWT strategy (`src/auth.ts`), PrismaAdapter
- **ID conventions:** `Profile`, `Service`, `Booking` use `Int @id @default(autoincrement())`. `Staff`, `Conversation`, `Message`, `Review`, `Favorite` use `String @id @default(cuid())`. New model follows the cuid pattern.
- **Prisma version:** 5.22.0 (check: `npx prisma --version`)

### Anti-Patterns to Avoid

- **DO NOT** modify any existing fields on `Profile`, `Service`, or `Staff` — only add the new `photos` relation line
- **DO NOT** remove or rename `Profile.gallery`, `Profile.studioImages`, or `Service.images` — these String[] fields stay as-is for backward compatibility. They will be deprecated in a later story (1.3).
- **DO NOT** add seed data or migration scripts for existing photos — that's Story 1.3
- **DO NOT** add API routes — that's Story 1.4
- **DO NOT** change `onDelete` behavior on any existing relations

### Verification Commands

After implementation, run these to verify:

```bash
# Generate migration
npx prisma migrate dev --name add_portfolio_photo

# Verify client generation
npx prisma generate

# Verify schema validity
npx prisma validate

# Check migration SQL (should be additive CREATE TABLE only + FK constraints)
cat prisma/migrations/*add_portfolio_photo/migration.sql
```

### References

- [Source: _bmad-output/BLUEPRINT-salon-slug-redesign.md#4.2 — Required Change: PortfolioPhoto Model]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.1]
- [Source: prisma/schema.prisma — current schema, all existing models]

### Review Findings

- [x] [Review][Patch] No `updatedAt` field on PortfolioPhoto — fixed: added `updatedAt DateTime @updatedAt` [prisma/schema.prisma:201]
- [x] [Review][Defer] Missing `migration_lock.toml` in migrations dir — pre-existing, not caused by this change
- [x] [Review][Defer] No length constraint on `url` field — matches existing schema patterns, pre-existing
- [x] [Review][Defer] Concurrent `position: 0` inserts — application-layer concern for Story 1.4 API endpoints

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (Amelia persona, BMAD dev-story workflow)

### Debug Log References

- Shadow DB issue: `prisma migrate dev` failed due to pre-existing migration `20240101000000_add_telegram_token` referencing `Profile` table before it existed in shadow DB replay. Base tables were created via `db push` before migrations were adopted. Workaround: generated SQL via `prisma migrate diff --from-schema-datasource --to-schema-datamodel`, created migration file manually, applied via `prisma db push`.
- Missing `migration_lock.toml` in migrations directory (pre-existing project issue).

### Completion Notes List

- PortfolioPhoto model added with 7 fields, 3 FKs, 4 indexes
- Reverse `photos PortfolioPhoto[]` relations added to Profile, Service, Staff
- `prisma validate` passed
- `prisma db push` synced schema to Neon PostgreSQL
- `prisma generate` produced client with `portfolioPhoto` accessor confirmed
- Full test suite: 17 files, 139 tests, 0 failures
- All 7 ACs satisfied

### Change Log

- 2026-04-12: Story 1.1 implemented — PortfolioPhoto model, migration, relations

### File List

- `prisma/schema.prisma` — modified (added PortfolioPhoto model + 3 reverse relation lines on Profile, Service, Staff)
- `prisma/migrations/20260412120000_add_portfolio_photo/migration.sql` — created (additive: 1 CREATE TABLE, 4 CREATE INDEX, 3 ADD CONSTRAINT)
