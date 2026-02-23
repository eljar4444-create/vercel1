/**
 * Backfill slugs for all existing profiles.
 * Run: node scripts/backfill-slugs.js
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const GERMAN_MAP = {
    'ä': 'ae', 'ö': 'oe', 'ü': 'ue', 'ß': 'ss',
    'Ä': 'Ae', 'Ö': 'Oe', 'Ü': 'Ue',
};

const RUSSIAN_MAP = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
    'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
    'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
    'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch',
    'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
    'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'Yo',
    'Ж': 'Zh', 'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M',
    'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U',
    'Ф': 'F', 'Х': 'Kh', 'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Shch',
    'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya',
};

const MAP = { ...GERMAN_MAP, ...RUSSIAN_MAP };

function slugify(text) {
    return text
        .split('')
        .map((c) => MAP[c] || c)
        .join('')
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}

async function main() {
    const prisma = new PrismaClient();

    try {
        const profiles = await prisma.profile.findMany({
            where: { slug: null },
            select: { id: true, name: true, city: true },
        });

        console.log(`Found ${profiles.length} profiles without slugs.`);

        const usedSlugs = new Set();
        const existing = await prisma.profile.findMany({
            where: { slug: { not: null } },
            select: { slug: true },
        });
        for (const e of existing) {
            if (e.slug) usedSlugs.add(e.slug);
        }

        for (const profile of profiles) {
            const base = slugify(`${profile.name} ${profile.city}`) || `profile-${profile.id}`;

            let candidate = base;
            let suffix = 2;
            while (usedSlugs.has(candidate)) {
                candidate = `${base}-${suffix}`;
                suffix++;
            }

            usedSlugs.add(candidate);

            await prisma.profile.update({
                where: { id: profile.id },
                data: { slug: candidate },
            });

            console.log(`  Profile #${profile.id} → ${candidate}`);
        }

        console.log('Done!');
    } finally {
        await prisma.$disconnect();
    }
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
