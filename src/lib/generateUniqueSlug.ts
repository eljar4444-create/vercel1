import prisma from '@/lib/prisma';
import { slugify } from '@/lib/slugify';

/**
 * Generate a unique slug for a profile from name + city.
 * If the slug already exists, appends -2, -3, etc.
 *
 * @param name      Master or salon name
 * @param city      City name
 * @param excludeId Profile ID to exclude from uniqueness check (for updates)
 */
export async function generateUniqueSlug(
    name: string,
    city: string,
    excludeId?: number,
): Promise<string> {
    const base = slugify(`${name} ${city}`) || `profile-${Date.now()}`;

    let candidate = base;
    let suffix = 2;

    while (true) {
        const existing = await prisma.profile.findUnique({
            where: { slug: candidate },
            select: { id: true },
        });

        if (!existing || existing.id === excludeId) {
            return candidate;
        }

        candidate = `${base}-${suffix}`;
        suffix++;
    }
}
