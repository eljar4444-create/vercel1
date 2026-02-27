import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔄 Cleaning up categories database...');

    // 1. Find the "beauty" category (or create it if it doesn't exist)
    let beautyCategory = await prisma.category.findUnique({
        where: { slug: 'beauty' }
    });

    if (!beautyCategory) {
        console.log('💅 Creating "beauty" category...');
        beautyCategory = await prisma.category.create({
            data: {
                name: 'Красота',
                slug: 'beauty',
                icon: '💅',
                form_schema: {}
            }
        });
    }

    console.log(`✅ Beauty category found (ID: ${beautyCategory.id})`);

    // 2. Fetch all other categories
    const otherCategories = await prisma.category.findMany({
        where: {
            slug: {
                not: 'beauty'
            }
        }
    });

    if (otherCategories.length === 0) {
        console.log('✨ No other categories to clear up.');
    } else {
        const otherIds = otherCategories.map(c => c.id);
        console.log(`🧹 Found ${otherIds.length} categories to delete/migrate: ${otherCategories.map(c => c.name).join(', ')}`);

        // 3. Reassign profiles that belong to these other categories
        const updatedProfiles = await prisma.profile.updateMany({
            where: {
                category_id: { in: otherIds }
            },
            data: {
                category_id: beautyCategory.id
            }
        });

        console.log(`✅ Reassigned ${updatedProfiles.count} profiles to "Красота"`);

        // 4. Delete the other categories
        // We might need to handle other relations if there are any, but currently only Profile references category.
        const deletedCategories = await prisma.category.deleteMany({
            where: {
                id: { in: otherIds }
            }
        });

        console.log(`🗑️ Deleted ${deletedCategories.count} old categories`);
    }

    console.log('🎉 Cleanup complete!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
