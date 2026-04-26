// Deletes every Profile except #6 (EMIL) and #7 (Eliar Mamedov) in a single transaction.
// Handles all FK chains explicitly: orders deletes from leaf to root.
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const KEEP_IDS = [6, 7];

async function main() {
    const targets = await prisma.profile.findMany({
        where: { id: { notIn: KEEP_IDS } },
        select: { id: true, slug: true, name: true },
    });
    const targetIds = targets.map((p) => p.id);
    console.log(`Deleting ${targets.length} profiles: ${targetIds.join(', ')}`);

    if (targetIds.length === 0) {
        console.log('Nothing to delete.');
        return;
    }

    // Find conversations bound to these profiles so we can cascade messages first
    const conversations = await prisma.conversation.findMany({
        where: { providerProfileId: { in: targetIds } },
        select: { id: true },
    });
    const conversationIds = conversations.map((c) => c.id);
    console.log(`  conversations to clear: ${conversationIds.length}`);

    // Find staff bound to these profiles
    const staff = await prisma.staff.findMany({
        where: { profileId: { in: targetIds } },
        select: { id: true },
    });
    const staffIds = staff.map((s) => s.id);
    console.log(`  staff to clear: ${staffIds.length}`);

    const result = await prisma.$transaction(async (tx) => {
        const stats = {};

        // Leaves first
        if (conversationIds.length > 0) {
            stats.messages = (await tx.message.deleteMany({ where: { conversationId: { in: conversationIds } } })).count;
        }
        stats.favorites = (await tx.favorite.deleteMany({ where: { providerProfileId: { in: targetIds } } })).count;
        stats.telegramTokens = (await tx.telegramToken.deleteMany({ where: { profileId: { in: targetIds } } })).count;
        stats.reviews = (await tx.review.deleteMany({ where: { profileId: { in: targetIds } } })).count;
        stats.bookings = (await tx.booking.deleteMany({ where: { profile_id: { in: targetIds } } })).count;
        stats.clients = (await tx.client.deleteMany({ where: { profileId: { in: targetIds } } })).count;
        stats.portfolioPhotos = (await tx.portfolioPhoto.deleteMany({ where: { profileId: { in: targetIds } } })).count;

        // Staff sub-tables (availability rows reference staffId)
        if (staffIds.length > 0) {
            try {
                stats.staffAvailability = (await tx.staffAvailability.deleteMany({ where: { staffId: { in: staffIds } } })).count;
            } catch (e) {
                console.warn('  staffAvailability delete skipped:', e.message);
            }
        }
        stats.staff = (await tx.staff.deleteMany({ where: { profileId: { in: targetIds } } })).count;

        // Services (their portfolio photos already cleared above; service↔staff M2M auto-clears via Prisma)
        stats.services = (await tx.service.deleteMany({ where: { profile_id: { in: targetIds } } })).count;

        // Conversations themselves (after their messages)
        if (conversationIds.length > 0) {
            stats.conversations = (await tx.conversation.deleteMany({ where: { id: { in: conversationIds } } })).count;
        }

        // Finally the profiles
        stats.profiles = (await tx.profile.deleteMany({ where: { id: { in: targetIds } } })).count;

        return stats;
    }, { timeout: 30000 });

    console.log('\nDeletion stats:');
    Object.entries(result).forEach(([k, v]) => console.log(`  ${k}: ${v}`));

    // Verify
    const remaining = await prisma.profile.findMany({
        select: { id: true, slug: true, name: true, city: true, status: true },
        orderBy: { id: 'asc' },
    });
    console.log('\nRemaining profiles:');
    remaining.forEach((p) => console.log(`  #${p.id} ${p.name} (${p.slug}) — ${p.city}, ${p.status}`));
}

main()
    .catch((e) => { console.error('FAILED:', e); process.exit(1); })
    .finally(() => prisma.$disconnect());
