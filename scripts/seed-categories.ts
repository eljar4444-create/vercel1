import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const categories = [
    {
        name: 'Уборка',
        slug: 'cleaning',
        icon: 'Broom',
        form_schema: { type: 'cleaning', questions: [] }
    },
    {
        name: 'Ремонт',
        slug: 'repair',
        icon: 'Wrench',
        form_schema: { type: 'repair', questions: [] }
    },
    {
        name: 'Красота',
        slug: 'beauty',
        icon: 'Sparkles',
        form_schema: { type: 'beauty', questions: [] }
    },
    {
        name: 'Репетиторы',
        slug: 'tutor',
        icon: 'BookOpen',
        form_schema: { type: 'tutor', questions: [] }
    },
    {
        name: 'Переезд',
        slug: 'moving',
        icon: 'Truck',
        form_schema: { type: 'moving', questions: [] }
    },
    {
        name: 'Сантехника',
        slug: 'plumbing',
        icon: 'Droplets',
        form_schema: { type: 'plumbing', questions: [] }
    },
    {
        name: 'Электрика',
        slug: 'electrician',
        icon: 'Zap',
        form_schema: { type: 'electrician', questions: [] }
    },
    {
        name: 'Курьер',
        slug: 'courier',
        icon: 'Package',
        form_schema: { type: 'courier', questions: [] }
    }
];

async function main() {
    console.log('Seeding categories...');
    for (const cat of categories) {
        await prisma.category.upsert({
            where: { slug: cat.slug },
            update: {},
            create: {
                name: cat.name,
                slug: cat.slug,
                icon: cat.icon,
                form_schema: cat.form_schema
            }
        });
    }
    console.log('Categories seeded!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
