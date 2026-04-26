const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const slug = process.argv[2] || 'eliar-mamedov-bayreuth';

    const profile = await prisma.profile.findFirst({
        where: { slug },
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
            user_id: true,
            user: { select: { isBanned: true, email: true } },
            category: { select: { slug: true, name: true } },
            services: { select: { id: true, title: true, price: true } },
        },
    });

    if (!profile) {
        console.log(`No profile found with slug "${slug}"`);
        const byName = await prisma.profile.findMany({
            where: { name: { contains: 'Eliar', mode: 'insensitive' } },
            select: { id: true, slug: true, name: true, status: true, city: true },
        });
        if (byName.length > 0) {
            console.log('Profiles matching name "Eliar":');
            console.log(JSON.stringify(byName, null, 2));
        }
        return;
    }

    console.log('=== Profile snapshot ===');
    console.log(JSON.stringify(profile, null, 2));

    // Diagnostic gates that mirror search/page.tsx
    console.log('\n=== Public-search gate diagnostics ===');
    const gates = [
        { name: "status === 'PUBLISHED'", pass: profile.status === 'PUBLISHED', actual: profile.status },
        { name: 'is_verified === true', pass: profile.is_verified === true, actual: profile.is_verified },
        { name: "category.slug !== 'health'", pass: profile.category?.slug !== 'health', actual: profile.category?.slug },
        { name: 'user.isBanned !== true (orphan-safe)', pass: profile.user?.isBanned !== true, actual: profile.user?.isBanned },
        { name: 'latitude IS NOT NULL', pass: profile.latitude !== null, actual: profile.latitude },
        { name: 'longitude IS NOT NULL', pass: profile.longitude !== null, actual: profile.longitude },
    ];
    gates.forEach((g) => {
        console.log(`${g.pass ? '✓' : '✗'} ${g.name}  →  actual: ${JSON.stringify(g.actual)}`);
    });

    const failures = gates.filter((g) => !g.pass);
    console.log(`\n${failures.length === 0 ? 'All public-search gates pass.' : `${failures.length} gate(s) blocking visibility.`}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
