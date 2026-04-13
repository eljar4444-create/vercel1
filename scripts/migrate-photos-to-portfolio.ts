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
    console.log('📸 Migrating photos to PortfolioPhoto...');

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

            try {
                // Service.images
                for (const service of profile.services) {
                    if (service.images.length === 0) continue;
                    for (let pos = 0; pos < service.images.length; pos++) {
                        const url = service.images[pos];
                        const existing = await prisma.portfolioPhoto.findFirst({
                            where: { profileId: profile.id, serviceId: service.id, url },
                        });
                        if (existing) {
                            counts.skipped++;
                            continue;
                        }
                        await prisma.portfolioPhoto.create({
                            data: {
                                profileId: profile.id,
                                serviceId: service.id,
                                url,
                                position: pos,
                            },
                        });
                        counts.services++;
                    }
                }

                // Profile.gallery
                if (profile.gallery.length > 0) {
                    for (let pos = 0; pos < profile.gallery.length; pos++) {
                        const url = profile.gallery[pos];
                        const existing = await prisma.portfolioPhoto.findFirst({
                            where: { profileId: profile.id, serviceId: null, url },
                        });
                        if (existing) {
                            counts.skipped++;
                            continue;
                        }
                        await prisma.portfolioPhoto.create({
                            data: { profileId: profile.id, url, position: pos },
                        });
                        counts.gallery++;
                    }
                }

                // Profile.studioImages
                if (profile.studioImages.length > 0) {
                    for (let pos = 0; pos < profile.studioImages.length; pos++) {
                        const url = profile.studioImages[pos];
                        const existing = await prisma.portfolioPhoto.findFirst({
                            where: { profileId: profile.id, serviceId: null, url },
                        });
                        if (existing) {
                            counts.skipped++;
                            continue;
                        }
                        await prisma.portfolioPhoto.create({
                            data: {
                                profileId: profile.id,
                                url,
                                position: STUDIO_POSITION_OFFSET + pos,
                            },
                        });
                        counts.studio++;
                    }
                }

                const created = counts.services + counts.gallery + counts.studio;
                if (created > 0 || counts.skipped > 0) {
                    console.log(
                        `✅ ${profile.slug} — services: ${counts.services}, gallery: ${counts.gallery}, studio: ${counts.studio} (skipped ${counts.skipped})`
                    );
                }
                totalCreated += created;
                totalSkipped += counts.skipped;
            } catch (err) {
                console.error(`❌ Error processing profile ${profile.slug}:`, err);
                // continue with next profile — partial failure tolerance
            }
        }
    }

    console.log(
        `\n📊 Summary: ${totalCreated} records created, ${totalSkipped} skipped across ${profiles.length} profiles.`
    );
}

main()
    .catch((e) => {
        console.error('❌ Migration failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
