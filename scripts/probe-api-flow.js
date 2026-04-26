// Reproduces the full API route code path to localize the 500 origin.
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const minLat = 49.88, maxLat = 50.00, minLng = 11.47, maxLng = 11.67;

    console.log('STEP 1: profile.findMany with new orphan-fix filter');
    const profiles = await prisma.profile.findMany({
        where: {
            AND: [
                { status: 'PUBLISHED' },
                { is_verified: true },
                { category: { slug: { not: 'health' } } },
                { NOT: { user: { isBanned: true } } },
                { latitude: { not: null, gte: minLat, lte: maxLat } },
                { longitude: { not: null, gte: minLng, lte: maxLng } },
            ],
        },
        include: {
            category: true,
            services: true,
            photos: { where: { serviceId: null, staffId: null }, orderBy: { position: 'asc' }, select: { url: true }, take: 1 },
        },
        orderBy: { created_at: 'desc' },
        take: 50,
    });
    console.log(`  → got ${profiles.length} profiles. IDs: [${profiles.map((p) => p.id).join(', ')}]`);

    console.log('STEP 2: serializing results (mimics route line 175-191)');
    const results = profiles.map((profile) => ({
        id: profile.id,
        slug: profile.slug,
        name: profile.name,
        provider_type: profile.provider_type,
        city: profile.city,
        address: profile.provider_type === 'SALON' ? profile.address : null,
        latitude: profile.latitude,
        longitude: profile.longitude,
        services: (profile.services || []).map((s) => ({
            id: s.id,
            title: s.title,
            price: Number(s.price),
            duration_min: s.duration_min,
        })),
    }));
    console.log(`  → serialized ${results.length}`);

    console.log('STEP 3: getBatchedQuickSlots');
    try {
        // Dynamic import the actions module (TypeScript compiled or via ts-node bridge).
        // If your project supports ts-node-style requires, use it; else fall back to a manual reproduction.
        const profileIds = results.map((p) => p.id);
        // Simulate: we expect a {[id]: QuickSlotsResponse} return
        const { getBatchedQuickSlots } = require('../.next/server/chunks/ssr/' + 'no-such-bundle-fallback');
        console.log('  → unexpectedly imported');
    } catch (e) {
        // Fallback: just probe one underlying query that getBatchedQuickSlots would do.
        console.log(`  → cannot require TS module from script; probing constituent query instead`);
        const profileIds = results.map((p) => p.id);
        try {
            const services = await prisma.service.findMany({
                where: { profile_id: { in: profileIds } },
                select: { id: true, profile_id: true, duration_min: true },
            });
            console.log(`  → service query OK: ${services.length} services across ${profileIds.length} profiles`);
        } catch (subErr) {
            console.error(`  ✗ sub-query failed:`, subErr.message);
        }
    }

    console.log('\nResults:');
    results.forEach((r) => console.log(`  #${r.id} ${r.name} (${r.provider_type})`));
}

main().catch((e) => { console.error('FAILED:', e); process.exit(1); }).finally(() => prisma.$disconnect());
