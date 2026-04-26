const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const pattern = process.argv[2];
    if (!pattern) {
        console.log('Usage: node scripts/find-profiles.js <name-or-slug-pattern>');
        process.exit(1);
    }

    const profiles = await prisma.profile.findMany({
        where: {
            OR: [
                { name: { contains: pattern, mode: 'insensitive' } },
                { slug: { contains: pattern, mode: 'insensitive' } },
            ],
        },
        select: {
            id: true,
            slug: true,
            name: true,
            city: true,
            address: true,
            status: true,
            is_verified: true,
            onboardingCompleted: true,
            provider_type: true,
            latitude: true,
            longitude: true,
            user: { select: { isBanned: true } },
            category: { select: { slug: true } },
            services: { select: { title: true } },
        },
        orderBy: { id: 'asc' },
    });

    if (profiles.length === 0) {
        console.log(`No profiles found matching "${pattern}"`);
        return;
    }

    console.log(`Found ${profiles.length} profile(s) matching "${pattern}":\n`);
    profiles.forEach((p) => {
        const gates = {
            published: p.status === 'PUBLISHED',
            verified: p.is_verified === true,
            notHealth: p.category?.slug !== 'health',
            notBanned: p.user?.isBanned !== true, // mirrors `NOT: { user: { isBanned: true } }` — orphan profiles (user=null) pass
            hasLat: p.latitude !== null,
            hasLng: p.longitude !== null,
        };
        const allPass = Object.values(gates).every(Boolean);
        const failures = Object.entries(gates).filter(([, v]) => !v).map(([k]) => k);

        console.log(`#${p.id} ${p.name} (slug: ${p.slug})`);
        console.log(`  city: ${p.city}, address: ${p.address ?? '(null)'}`);
        console.log(`  status: ${p.status}, is_verified: ${p.is_verified}, provider_type: ${p.provider_type}`);
        console.log(`  category: ${p.category?.slug}, lat: ${p.latitude}, lng: ${p.longitude}`);
        console.log(`  services: ${p.services.map((s) => s.title).join(' | ') || '(none)'}`);
        console.log(`  search-gate: ${allPass ? '✓ ALL PASS' : `✗ FAIL (${failures.join(', ')})`}`);
        console.log('');
    });
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
