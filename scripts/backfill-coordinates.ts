/**
 * One-time script to backfill latitude/longitude for existing profiles.
 *
 * Usage:  npx tsx scripts/backfill-coordinates.ts
 *
 * Respects Nominatim's 1 request/second rate limit.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const NOMINATIM_DELAY_MS = 1100; // slightly above 1 s to be safe

async function geocode(
    address: string | null,
    city: string
): Promise<{ lat: number; lng: number } | null> {
    const query = [address, city, 'Germany'].filter(Boolean).join(', ');
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;

    const response = await fetch(url, {
        headers: {
            'User-Agent': 'Svoi-App/1.0 (contact@svoi.de)',
            Accept: 'application/json',
        },
    });

    if (!response.ok) {
        console.error(`  ✗ Nominatim returned ${response.status}`);
        return null;
    }

    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) {
        return null;
    }

    const lat = parseFloat(data[0].lat);
    const lng = parseFloat(data[0].lon);
    if (isNaN(lat) || isNaN(lng)) return null;

    return { lat, lng };
}

function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
    const profiles = await prisma.profile.findMany({
        where: {
            OR: [{ latitude: null }, { longitude: null }],
        },
        select: { id: true, name: true, city: true, address: true },
    });

    console.log(`\n🔍 Found ${profiles.length} profiles without coordinates.\n`);

    let updated = 0;
    let failed = 0;

    for (const profile of profiles) {
        const label = `#${profile.id} "${profile.name}" (${profile.city})`;

        try {
            const coords = await geocode(profile.address, profile.city);

            if (coords) {
                await prisma.profile.update({
                    where: { id: profile.id },
                    data: { latitude: coords.lat, longitude: coords.lng },
                });
                console.log(`  ✓ ${label} → ${coords.lat}, ${coords.lng}`);
                updated++;
            } else {
                console.warn(`  ⚠ ${label} → could not geocode`);
                failed++;
            }
        } catch (err) {
            console.error(`  ✗ ${label} → error:`, err);
            failed++;
        }

        // Respect Nominatim rate limit
        await sleep(NOMINATIM_DELAY_MS);
    }

    console.log(`\n✅ Done. Updated: ${updated}, Failed: ${failed}\n`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
