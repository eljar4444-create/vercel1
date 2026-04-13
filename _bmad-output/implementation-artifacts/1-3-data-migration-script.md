# Story 1.3: Data Migration Script — Existing Photos to PortfolioPhoto

Status: done

## Story

As a developer,
I want a migration script that converts existing `Service.images`, `Profile.gallery`, and `Profile.studioImages` String[] data into `PortfolioPhoto` records,
so that existing photo data is preserved when the frontend switches to the new PortfolioPhoto model.

## Acceptance Criteria

1. **AC-001:** Script reads all `Service.images` arrays and creates `PortfolioPhoto` records with matching `profileId` + `serviceId`. First image in each array gets `position: 0` (cover); subsequent images get incrementing positions (1, 2, 3, ...). `staffId: null`.
2. **AC-002:** Script reads all `Profile.gallery` arrays and creates `PortfolioPhoto` records with `profileId` only (`serviceId: null`, `staffId: null`). Position = array index.
3. **AC-003:** Script reads all `Profile.studioImages` arrays and creates `PortfolioPhoto` records with `profileId` only, **distinguishable from gallery photos via a `position` offset of 10000** (e.g., studioImages[0] → position 10000, studioImages[1] → position 10001). This is a migration-internal convention documented in the script header.
4. **AC-004:** Script is **idempotent** — running it twice does not create duplicates. Idempotency check: before insert, query `PortfolioPhoto.findFirst({ where: { profileId, serviceId, url } })` — skip if match exists.
5. **AC-005:** Script logs per-profile counts in the format `✅ <profile.slug> — services: N photos, gallery: M photos, studio: K photos (skipped D duplicates)`. Final summary logs totals.
6. **AC-006:** Original String[] fields (`Service.images`, `Profile.gallery`, `Profile.studioImages`) are **NOT deleted** — they remain as fallback until full migration is verified in production. Schema changes are out of scope; deprecation is a later story.

## Tasks / Subtasks

- [x] Task 1: Create script file with header + idempotency convention doc (AC: 003, 004)
  - [x] 1.1: Created `scripts/migrate-photos-to-portfolio.ts` following `scripts/seed-categories.ts` pattern
  - [x] 1.2: Top-of-file block comment documents the +10000 position-offset convention for studioImages
- [x] Task 2: Implement core migration logic (AC: 001, 002, 003)
  - [x] 2.1: Query all profiles with `include: { services: true }`, iterate in batches of 50
  - [x] 2.2: Service.images → PortfolioPhoto with `profileId` + `serviceId` + position = array index (0 = cover)
  - [x] 2.3: Profile.gallery → PortfolioPhoto with `profileId` only, `serviceId: null`, position = array index
  - [x] 2.4: Profile.studioImages → PortfolioPhoto with `profileId` only, position = `STUDIO_POSITION_OFFSET + array index` (10000+)
- [x] Task 3: Implement idempotency check (AC: 004)
  - [x] 3.1: `findFirst({ where: { profileId, serviceId, url } })` before each insert; skip if match
  - [x] 3.2: Per-profile `skipped` counter tracked
- [x] Task 4: Implement logging (AC: 005)
  - [x] 4.1: Per-profile line emitted only when created > 0 OR skipped > 0 (avoids noise for empty profiles)
  - [x] 4.2: Final summary: total created, total skipped, total profiles scanned
- [x] Task 5: Add npm script and verify end-to-end (AC: 001-006)
  - [x] 5.1: Added `"migrate:photos": "ts-node scripts/migrate-photos-to-portfolio.ts"` to `package.json`
  - [x] 5.2: First run: 2 records created across 20 profiles
  - [x] 5.3: Verified count: `PortfolioPhoto` = 2 matches sum of all source arrays = 2
  - [x] 5.4: Second run: 0 created, 2 skipped — idempotency confirmed
  - [x] 5.5: Test suite: 17/17 files, 139/139 tests pass — zero regressions

## Dev Notes

### Script Location and Invocation

- **File:** `scripts/migrate-photos-to-portfolio.ts`
- **Pattern to follow:** `scripts/seed-categories.ts` — standalone Prisma script with `main()` + `.catch()` + `.finally(prisma.$disconnect)`
- **Invocation:** `npm run migrate:photos` (add new entry to `package.json` scripts)
- **Runtime:** `ts-node` (already a devDependency at `package.json:83`)

### Existing Data Shapes (from `prisma/schema.prisma`)

- `Profile.gallery     String[] @default([])` — [schema.prisma:49](prisma/schema.prisma#L49)
- `Profile.studioImages String[] @default([])` — [schema.prisma:50](prisma/schema.prisma#L50)
- `Service.images      String[] @default([])` — [schema.prisma:97](prisma/schema.prisma#L97)

### Position Convention (AC-003 rationale)

`PortfolioPhoto.position` is re-used as an encoding channel during migration because adding a new `kind` field would exceed this story's schema-frozen scope. The convention:

| Source | profileId | serviceId | position range |
|---|---|---|---|
| `Service.images` | set | set | 0..N-1 (0 = cover) |
| `Profile.gallery` | set | null | 0..N-1 |
| `Profile.studioImages` | set | null | 10000..10000+N-1 |

Downstream queries distinguish gallery vs studio with `WHERE position < 10000` vs `WHERE position >= 10000`. Once the Dashboard upload flow (Story 2.3, AC-004) is live and old String[] fields are removed, this convention becomes vestigial — no behavioral coupling.

### Script Skeleton (reference)

```typescript
/**
 * Migrate existing Service.images / Profile.gallery / Profile.studioImages
 * into PortfolioPhoto records.
 *
 * Idempotent: safe to run multiple times — duplicates detected via
 * (profileId, serviceId, url) composite match.
 *
 * Position convention for studioImages: offset +10000 to distinguish
 * from gallery at query time. See Story 1.3 dev notes.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const STUDIO_POSITION_OFFSET = 10000;
const BATCH_SIZE = 50;

async function main() {
  const profiles = await prisma.profile.findMany({
    include: { services: true },
    orderBy: { id: 'asc' },
  });

  let totalCreated = 0;
  let totalSkipped = 0;

  for (let i = 0; i < profiles.length; i += BATCH_SIZE) {
    const batch = profiles.slice(i, i + BATCH_SIZE);
    for (const profile of batch) {
      const counts = { services: 0, gallery: 0, studio: 0, skipped: 0 };

      // Service.images
      for (const service of profile.services) {
        for (let pos = 0; pos < service.images.length; pos++) {
          const url = service.images[pos];
          const existing = await prisma.portfolioPhoto.findFirst({
            where: { profileId: profile.id, serviceId: service.id, url },
          });
          if (existing) { counts.skipped++; continue; }
          await prisma.portfolioPhoto.create({
            data: { profileId: profile.id, serviceId: service.id, url, position: pos },
          });
          counts.services++;
        }
      }

      // Profile.gallery
      for (let pos = 0; pos < profile.gallery.length; pos++) {
        const url = profile.gallery[pos];
        const existing = await prisma.portfolioPhoto.findFirst({
          where: { profileId: profile.id, serviceId: null, url },
        });
        if (existing) { counts.skipped++; continue; }
        await prisma.portfolioPhoto.create({
          data: { profileId: profile.id, url, position: pos },
        });
        counts.gallery++;
      }

      // Profile.studioImages
      for (let pos = 0; pos < profile.studioImages.length; pos++) {
        const url = profile.studioImages[pos];
        const existing = await prisma.portfolioPhoto.findFirst({
          where: { profileId: profile.id, serviceId: null, url },
        });
        if (existing) { counts.skipped++; continue; }
        await prisma.portfolioPhoto.create({
          data: {
            profileId: profile.id,
            url,
            position: STUDIO_POSITION_OFFSET + pos,
          },
        });
        counts.studio++;
      }

      console.log(
        `✅ ${profile.slug} — services: ${counts.services}, gallery: ${counts.gallery}, studio: ${counts.studio} (skipped ${counts.skipped})`
      );
      totalCreated += counts.services + counts.gallery + counts.studio;
      totalSkipped += counts.skipped;
    }
  }

  console.log(`\n📊 Summary: ${totalCreated} records created, ${totalSkipped} skipped across ${profiles.length} profiles.`);
}

main()
  .catch((e) => { console.error('❌ Migration failed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
```

### Idempotency Rationale

The composite `(profileId, serviceId, url)` is unique enough in practice — the same URL should not appear twice in the same service's image array (that would be a dashboard UX bug upstream). For gallery/studio where `serviceId = null`, `(profileId, null, url)` still provides a valid idempotent signature since gallery/studio contain profile-scoped URLs.

**Edge case:** If the same URL appears in BOTH gallery and studioImages, only the first one encountered (gallery, by order in script) will be inserted. This is acceptable — duplicate URLs across buckets are a data-entry bug, not a migration concern.

### Previous Story Intelligence

- **From Story 1.1:** `PortfolioPhoto` model has `@@index([profileId, serviceId])` — the idempotency query uses this index efficiently.
- **From Story 1.2:** No `migrate dev` — but this story doesn't create a Prisma migration, it's a data script. Standard `ts-node` invocation works.
- **Test baseline:** 17 files, 139 tests, 0 failures.
- **Scripts pattern reference:** `scripts/seed-categories.ts` is the canonical shape for standalone Prisma scripts in this project.

### Anti-Patterns to Avoid

- **DO NOT** delete or modify `Service.images`, `Profile.gallery`, `Profile.studioImages` — AC-006 requires they stay as fallback.
- **DO NOT** add any schema changes (no new fields, no new indexes). Schema is frozen for this story.
- **DO NOT** use `createMany` — it skips the FK validation path and complicates idempotency. Use `create` in a loop; performance cost is acceptable for a one-time migration.
- **DO NOT** wrap in a single transaction — if one profile fails, the rest should still process. Log the error, continue.
- **DO NOT** shuffle or randomize position — AC-001 requires array index order to preserve the intended cover photo (index 0).
- **DO NOT** emit photos for empty arrays (check `length > 0` before iterating) — avoid noisy no-op log lines.

### Verification Commands

```bash
# Pre-migration baseline
npx prisma studio  # OR: psql query
# SELECT SUM(array_length(images, 1)) AS service_images FROM "Service" WHERE images IS NOT NULL;
# SELECT SUM(array_length(gallery, 1)) AS gallery_total FROM "Profile" WHERE gallery IS NOT NULL;
# SELECT SUM(array_length("studioImages", 1)) AS studio_total FROM "Profile" WHERE "studioImages" IS NOT NULL;

# Run migration
npm run migrate:photos

# Verify count matches
# SELECT COUNT(*) FROM "PortfolioPhoto";

# Run a second time — verify 0 inserts, all skipped
npm run migrate:photos

# Verify no test regressions
npx vitest run
```

### References

- [Source: _bmad-output/BLUEPRINT-salon-slug-redesign.md#4.2 — PortfolioPhoto Model]
- [Source: _bmad-output/BLUEPRINT-salon-slug-redesign.md#5.2 — Upload Flow: Salon Interior]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.3]
- [Source: _bmad-output/implementation-artifacts/1-1-create-portfoliophoto-model.md — PortfolioPhoto schema]
- [Source: scripts/seed-categories.ts — existing standalone script pattern]
- [Source: prisma/schema.prisma — current schema]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (Amelia persona, BMAD dev-story workflow)

### Debug Log References

- `ts-node -e` inline rejected `import` syntax; worked around by writing temp count script inside project root for baseline/post verification. Temp file deleted after verification.
- Node emits `MODULE_TYPELESS_PACKAGE_JSON` warning when running ts-node — pre-existing project state, same behavior as other scripts (seed-categories.ts). No action needed.

### Completion Notes List

- Migration script created at `scripts/migrate-photos-to-portfolio.ts`
- `npm run migrate:photos` added to `package.json:15`
- `STUDIO_POSITION_OFFSET = 10000` encodes the gallery-vs-studio distinguisher per AC-003
- `BATCH_SIZE = 50` for profile pagination
- Per-profile try/catch gives partial-failure tolerance — one bad profile doesn't halt the rest
- Pre-migration: 0 PortfolioPhoto, 2 Service.images, 0 gallery, 0 studioImages
- First run: 2 records created (1 each for `emil-bayreuth` and `eliar-mamedov-bayreuth` services)
- Second run: 0 created, 2 skipped — idempotency via `(profileId, serviceId, url)` composite match confirmed
- Test suite: 17/17 files, 139/139 tests pass — zero regressions
- All 6 ACs satisfied

### Change Log

- 2026-04-12: Story 1.3 implemented — data migration script for String[] → PortfolioPhoto
- 2026-04-12: Code review passed — all 6 ACs verified, no patches required

### Review Findings

- [x] [Review][Defer] Memory: `findMany` without pagination at line 20 loads all profiles+services — acceptable at current scale (20 profiles), paginate if scale exceeds ~1000
- [x] [Review][Defer] Duplicate URL within single Service.images array creates position gap — upstream data-entry concern, not migration
- [x] [Review][Defer] Failed-profiles audit list on catch — nice-to-have for large production runs

### File List

- `scripts/migrate-photos-to-portfolio.ts` — created (idempotent migration script, ~110 lines)
- `package.json` — modified (added `migrate:photos` npm script)
