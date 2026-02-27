import prisma from './prisma';

/**
 * Standardizes a string for use in URLs.
 * Replaces German umlauts with corresponding ASCII characters.
 * Removes special characters and replaces spaces with hyphens.
 */
export function createBaseSlug(name: string, city: string): string {
    const combined = `${name}-${city}`;

    return combined
        .toLowerCase()
        // Replace German umlauts
        .replace(/ä/g, 'ae')
        .replace(/ö/g, 'oe')
        .replace(/ü/g, 'ue')
        .replace(/ß/g, 'ss')
        // Replace cyrillic equivalent (basic transliteration if needed, or just let them be removed)
        // Since we are targeting Germany, we mainly care about german characters.
        // For cyrillic names, we'll do a simple transliteration:
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
        // Replace any remaining non-word characters with spaces
        .replace(/[^a-z0-9\s-]/g, ' ')
        // Replace multiple spaces or hyphens with a single hyphen
        .replace(/[\s-]+/g, '-')
        // Trim hyphens from start and end
        .replace(/^-+|-+$/g, '');
}

/**
 * Generates a unique slug for a profile by checking the database.
 * Appends "-2", "-3", etc., if the slug is already taken by another profile.
 */
export async function generateUniqueProfileSlug(name: string, city: string, currentProfileId?: number): Promise<string> {
    const baseSlug = createBaseSlug(name, city);
    let currentSlug = baseSlug;
    let counter = 2;

    while (true) {
        // Check if slug exists in database
        const existing = await prisma.profile.findUnique({
            where: { slug: currentSlug },
            select: { id: true }
        });

        // If it doesn't exist, or it belongs to the current profile we're updating, we're good
        if (!existing || existing.id === currentProfileId) {
            return currentSlug;
        }

        // Otherwise, append counter and try again
        currentSlug = `${baseSlug}-${counter}`;
        counter++;
    }
}
