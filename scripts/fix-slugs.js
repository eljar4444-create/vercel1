const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function createBaseSlug(name, city) {
    const combined = `${name}-${city}`;

    return combined
        .toLowerCase()
        .replace(/ä/g, 'ae')
        .replace(/ö/g, 'oe')
        .replace(/ü/g, 'ue')
        .replace(/ß/g, 'ss')
        .replace(/[аа́]/g, 'a')
        .replace(/[б]/g, 'b')
        .replace(/[в]/g, 'v')
        .replace(/[г]/g, 'g')
        .replace(/[д]/g, 'd')
        .replace(/[еёэ]/g, 'e')
        .replace(/[ж]/g, 'zh')
        .replace(/[з]/g, 'z')
        .replace(/[ийы]/g, 'i')
        .replace(/[к]/g, 'k')
        .replace(/[л]/g, 'l')
        .replace(/[м]/g, 'm')
        .replace(/[н]/g, 'n')
        .replace(/[оо́]/g, 'o')
        .replace(/[п]/g, 'p')
        .replace(/[р]/g, 'r')
        .replace(/[с]/g, 's')
        .replace(/[т]/g, 't')
        .replace(/[у]/g, 'u')
        .replace(/[ф]/g, 'f')
        .replace(/[х]/g, 'h')
        .replace(/[ц]/g, 'ts')
        .replace(/[ч]/g, 'ch')
        .replace(/[ш]/g, 'sh')
        .replace(/[щ]/g, 'sch')
        .replace(/[ъь]/g, '')
        .replace(/[ю]/g, 'yu')
        .replace(/[я]/g, 'ya')
        .replace(/[^a-z0-9\s-]/g, ' ')
        .replace(/[\s-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

async function nominatimSearch(query) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&addressdetails=1`;
    const response = await fetch(url, {
        headers: {
            'User-Agent': 'svoi.de/1.0 (contact@svoi.de)',
            'Accept-Language': 'de-DE,de;q=0.9',
            Accept: 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error(`Nominatim HTTP ${response.status}`);
    }

    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) {
        return null;
    }

    const address = data[0].address || {};
    const officialCity = address.city || address.town || address.village || address.municipality;

    return { city: officialCity };
}

async function fixSlugs() {
    console.log('--- Starting Slugs and City Normalization Migration ---');
    const profiles = await prisma.profile.findMany();

    console.log(`Found ${profiles.length} profiles to process.`);

    const usedSlugs = new Set();

    // First pass to pre-fill usedSlugs with any we skip, though we'll update all of them
    for (const profile of profiles) {
        try {
            const queryCity = profile.city || '';
            const queryAddress = profile.address || '';
            const query = [queryAddress, queryCity, 'Germany'].filter(Boolean).join(', ');

            console.log(`Processing ID ${profile.id} (${profile.name}): Geocoding "${query}"...`);
            let officialCity = queryCity; // fallback

            try {
                // Avoid ratelimiting Nominatim by adding 1s delay
                await new Promise(r => setTimeout(r, 1000));

                const result = await nominatimSearch(query);
                if (result && result.city) {
                    officialCity = result.city;
                    console.log(`  ✓ Found official city: ${officialCity}`);
                } else {
                    console.log(`  ⚠ No result from Nominatim. Keeping original city.`);
                }
            } catch (err) {
                console.warn(`  ! Geocoding error: ${err.message}. Keeping original city.`);
            }

            // Generate Slug
            let baseSlug = createBaseSlug(profile.name, officialCity);
            let finalSlug = baseSlug;
            let counter = 2;

            while (usedSlugs.has(finalSlug)) {
                finalSlug = `${baseSlug}-${counter}`;
                counter++;
            }
            usedSlugs.add(finalSlug);

            // Update Database
            await prisma.profile.update({
                where: { id: profile.id },
                data: {
                    city: officialCity,
                    slug: finalSlug
                }
            });

            // Also update the User model city
            if (profile.user_id) {
                await prisma.user.update({
                    where: { id: profile.user_id },
                    data: {
                        city: officialCity
                    }
                });
            }

            console.log(`  ✓ Updated ID ${profile.id}: City="${officialCity}", Slug="${finalSlug}"`);

        } catch (error) {
            console.error(`  ! Error processing ID ${profile.id}:`, error);
        }
    }

    console.log('--- Migration Completed ---');
    await prisma.$disconnect();
}

fixSlugs().catch((e) => {
    console.error(e);
    process.exit(1);
});
