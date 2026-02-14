const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding services...');

    // 1. Get Categories
    const cleaning = await prisma.category.findUnique({ where: { slug: 'cleaning' } });
    const repair = await prisma.category.findUnique({ where: { slug: 'repair' } });
    const beauty = await prisma.category.findUnique({ where: { slug: 'beauty' } });

    if (!cleaning || !repair || !beauty) {
        console.log('Categories not found. Run seed-categories.ts first.');
        return;
    }

    // 2. Create Profiles (Providers)
    // Check if they exist first to avoid duplicates on re-run
    let provider1 = await prisma.profile.findFirst({ where: { user_email: 'elena@example.com' } });
    if (!provider1) {
        provider1 = await prisma.profile.create({
            data: {
                user_id: 'seed-user-1',
                name: 'Елена Иванова',
                user_email: 'elena@example.com',
                city: 'Berlin',
                bio: 'Профессиональная уборка квартир и офисов. Опыт 5 лет.',
                image_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop',
                phone: '+4915123456789',
                is_verified: true,
                role: 'PROVIDER'
            }
        });
    }

    let provider2 = await prisma.profile.findFirst({ where: { user_email: 'alex@example.com' } });
    if (!provider2) {
        provider2 = await prisma.profile.create({
            data: {
                user_id: 'seed-user-2',
                name: 'Алексей Петров',
                user_email: 'alex@example.com',
                city: 'Munich',
                bio: 'Мастер на все руки. Сантехника, электрика, сборка мебели.',
                image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
                phone: '+4915198765432',
                is_verified: true,
                role: 'PROVIDER'
            }
        });
    }

    let provider3 = await prisma.profile.findFirst({ where: { user_email: 'maria@example.com' } });
    if (!provider3) {
        provider3 = await prisma.profile.create({
            data: {
                user_id: 'seed-user-3',
                name: 'Мария Сидорова',
                user_email: 'maria@example.com',
                city: 'Hamburg',
                bio: 'Маникюр, педикюр, наращивание ресниц с выездом на дом.',
                image_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop',
                phone: '+491715556667',
                is_verified: true,
                role: 'PROVIDER'
            }
        });
    }

    // 3. Create Services
    // Delete existing to avoid duplicates/clutter
    await prisma.directoryService.deleteMany({ where: { profile_id: { in: [provider1.id, provider2.id, provider3.id] } } });

    await prisma.directoryService.create({
        data: {
            profile_id: provider1.id,
            title: 'Генеральная уборка квартиры',
            description: 'Полная уборка всех комнат, мытье окон, чистка ковров. Использую свои профессиональные средства.',
            price: 15.00, // per hour
            duration: 180, // 3 hours
            currency: 'EUR',
            price_type: 'HOURLY'
        }
    });

    await prisma.directoryService.create({
        data: {
            profile_id: provider2.id,
            title: 'Сборка мебели IKEA',
            description: 'Быстро и аккуратно соберу любую мебель. Есть свой инструмент.',
            price: 50.00, // fixed
            duration: 60,
            currency: 'EUR',
            price_type: 'FIXED'
        }
    });

    await prisma.directoryService.create({
        data: {
            profile_id: provider1.id,
            title: 'Поддерживающая уборка',
            description: 'Регулярная влажная уборка, протирка пыли, санузлы.',
            price: 12.00,
            duration: 120,
            currency: 'EUR',
            price_type: 'HOURLY'
        }
    });

    await prisma.directoryService.create({
        data: {
            profile_id: provider3.id,
            title: 'Маникюр с покрытием гель-лак',
            description: 'Аппаратный маникюр, выравнивание, покрытие под кутикулу. Стерильный инструмент.',
            price: 35.00,
            duration: 90,
            currency: 'EUR',
            price_type: 'FIXED'
        }
    });

    console.log('Services seeded!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
