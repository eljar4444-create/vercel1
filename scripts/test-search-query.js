const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // Mimic the bbox the live SSR builds for lat=49.9446, lng=11.5743 (Bayreuth)
    // ±0.45° lat / ±0.7° lng
    const lat = 49.9446345;
    const lng = 11.5743543;
    const minLat = lat - 0.45;
    const maxLat = lat + 0.45;
    const minLng = lng - 0.7;
    const maxLng = lng + 0.7;

    console.log(`Bayreuth bbox: lat ∈ [${minLat.toFixed(4)}, ${maxLat.toFixed(4)}], lng ∈ [${minLng.toFixed(4)}, ${maxLng.toFixed(4)}]`);
    console.log('');

    // ── Test 1: SSR-style query (search/page.tsx) ──
    console.log('=== TEST 1: search/page.tsx filter set (with NOT-banned orphan fix) ===');
    const ssrResults = await prisma.profile.findMany({
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
        select: { id: true, name: true, slug: true, provider_type: true, city: true, latitude: true, longitude: true, user_id: true },
    });
    console.log(`Returned ${ssrResults.length} profile(s):`);
    ssrResults.forEach((p) => console.log(`  #${p.id} ${p.name} (${p.slug}) — ${p.provider_type} @ ${p.latitude},${p.longitude} user_id=${p.user_id}`));

    // ── Test 2: Tighter API-style bbox (~Bayreuth city only) ──
    console.log('');
    console.log('=== TEST 2: Tight 10km-ish bbox (matches what the map likely sends) ===');
    const tightMinLat = lat - 0.06;
    const tightMaxLat = lat + 0.06;
    const tightMinLng = lng - 0.10;
    const tightMaxLng = lng + 0.10;
    console.log(`Tight bbox: lat ∈ [${tightMinLat.toFixed(4)}, ${tightMaxLat.toFixed(4)}], lng ∈ [${tightMinLng.toFixed(4)}, ${tightMaxLng.toFixed(4)}]`);
    const tightResults = await prisma.profile.findMany({
        where: {
            AND: [
                { status: 'PUBLISHED' },
                { is_verified: true },
                { category: { slug: { not: 'health' } } },
                { NOT: { user: { isBanned: true } } },
                { latitude: { not: null, gte: tightMinLat, lte: tightMaxLat } },
                { longitude: { not: null, gte: tightMinLng, lte: tightMaxLng } },
            ],
        },
        select: { id: true, name: true, slug: true, provider_type: true, latitude: true, longitude: true, user_id: true },
    });
    console.log(`Returned ${tightResults.length} profile(s):`);
    tightResults.forEach((p) => console.log(`  #${p.id} ${p.name} (${p.slug}) — ${p.provider_type} @ ${p.latitude},${p.longitude} user_id=${p.user_id}`));

    // ── Test 3: Old over-restrictive filter (for comparison) ──
    console.log('');
    console.log('=== TEST 3: OLD filter { user: { isBanned: false } } (to confirm orphan drop) ===');
    const oldResults = await prisma.profile.findMany({
        where: {
            AND: [
                { status: 'PUBLISHED' },
                { is_verified: true },
                { category: { slug: { not: 'health' } } },
                { user: { isBanned: false } },
                { latitude: { not: null, gte: minLat, lte: maxLat } },
                { longitude: { not: null, gte: minLng, lte: maxLng } },
            ],
        },
        select: { id: true, name: true, slug: true, user_id: true },
    });
    console.log(`Returned ${oldResults.length} profile(s):`);
    oldResults.forEach((p) => console.log(`  #${p.id} ${p.name} (${p.slug}) user_id=${p.user_id}`));
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
