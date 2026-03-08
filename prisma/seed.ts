import { PrismaClient, ProviderType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // ── Categories (upsert to avoid duplicates) ──────────────────────────────

    const catBroviResnicy = await prisma.category.upsert({
        where: { slug: 'brovi-i-resnicy' },
        update: {},
        create: {
            name: 'Брови и ресницы',
            slug: 'brovi-i-resnicy',
            icon: '👁️',
            form_schema: {},
        },
    });

    const catYurist = await prisma.category.upsert({
        where: { slug: 'yurist' },
        update: {},
        create: {
            name: 'Юридические услуги',
            slug: 'yurist',
            icon: '⚖️',
            form_schema: {},
        },
    });

    // ── 1. Елена Соколова ─────────────────────────────────────────────────────

    const elena = await prisma.profile.upsert({
        where: { slug: 'elena-sokolova' },
        update: {
            latitude: 49.9456,
            longitude: 11.5713,
        },
        create: {
            slug: 'elena-sokolova',
            user_email: 'elena.sokolova@seed.local',
            name: 'Елена Соколова',
            provider_type: ProviderType.PRIVATE,
            city: 'Байройт',
            latitude: 49.9456,
            longitude: 11.5713,
            category_id: catBroviResnicy.id,
            attributes: {},
            bio: 'Мастер по взгляду. Делаю ваши глаза выразительными. Специализируюсь на ламинировании и ботоксе ресниц, а также классическом наращивании. Работаю аккуратно и стерильно.',
            is_verified: true,
        },
    });

    // Only create services if profile was just created (no existing services)
    const elenaServiceCount = await prisma.service.count({ where: { profile_id: elena.id } });
    if (elenaServiceCount === 0) {
        await prisma.service.createMany({
            data: [
                { profile_id: elena.id, title: 'Ламинирование ресниц', price: 35, duration_min: 60 },
                { profile_id: elena.id, title: 'Классическое наращивание ресниц', price: 40, duration_min: 90 },
                { profile_id: elena.id, title: 'Ботокс ресниц', price: 45, duration_min: 60 },
                { profile_id: elena.id, title: 'Снятие наращенных ресниц', price: 10, duration_min: 20 },
                { profile_id: elena.id, title: 'Окрашивание ресниц', price: 15, duration_min: 30 },
            ],
        });
    }

    // ── 2. Ксения Лобашова ────────────────────────────────────────────────────

    const kseniya = await prisma.profile.upsert({
        where: { slug: 'kseniya-lobashova' },
        update: {
            latitude: 49.4521,
            longitude: 11.0767,
        },
        create: {
            slug: 'kseniya-lobashova',
            user_email: 'kseniya.lobashova@seed.local',
            name: 'Ксения Лобашова',
            provider_type: ProviderType.PRIVATE,
            city: 'Нюрнберг',
            latitude: 49.4521,
            longitude: 11.0767,
            category_id: catBroviResnicy.id,
            attributes: {},
            bio: 'Сертифицированный мастер по наращиванию ресниц. Опыт работы более 3-х лет. Использую только качественные материалы премиум-класса. Индивидуальный подход к каждому клиенту.',
            is_verified: true,
        },
    });

    const kseniyaServiceCount = await prisma.service.count({ where: { profile_id: kseniya.id } });
    if (kseniyaServiceCount === 0) {
        await prisma.service.createMany({
            data: [
                { profile_id: kseniya.id, title: 'Классическое наращивание ресниц', price: 40, duration_min: 90 },
                { profile_id: kseniya.id, title: 'Наращивание ресниц (двойной объем)', price: 50, duration_min: 120 },
                { profile_id: kseniya.id, title: 'Снятие наращенных ресниц', price: 10, duration_min: 20 },
                { profile_id: kseniya.id, title: 'Наращивание ресниц (тройной объем)', price: 60, duration_min: 150 },
                { profile_id: kseniya.id, title: 'Наращивание ресниц (полуторный объем)', price: 45, duration_min: 100 },
            ],
        });
    }

    // ── 3. Светлана Жигер ─────────────────────────────────────────────────────

    const svetlana = await prisma.profile.upsert({
        where: { slug: 'svetlana-zhiger' },
        update: {
            latitude: 48.1371,
            longitude: 11.5754,
        },
        create: {
            slug: 'svetlana-zhiger',
            user_email: 'svetlana.zhiger@seed.local',
            name: 'Светлана Жигер',
            provider_type: ProviderType.PRIVATE,
            city: 'Мюнхен',
            address: 'Мариенплац',
            latitude: 48.1371,
            longitude: 11.5754,
            category_id: catYurist.id,
            attributes: {},
            bio: 'Юридическое сопровождение сделок, проверка чистоты сделок с недвижимостью. Составление и проверка юридических документов. Помощь в лицензировании. Также предоставляю услуги переводчика. Работаю в Мюнхене и Ландсхуте.',
            is_verified: true,
        },
    });

    const svetlanaServiceCount = await prisma.service.count({ where: { profile_id: svetlana.id } });
    if (svetlanaServiceCount === 0) {
        await prisma.service.createMany({
            data: [
                { profile_id: svetlana.id, title: 'Проверка чистоты сделок с недвижимостью', price: 0, duration_min: 60 },
                { profile_id: svetlana.id, title: 'Юридическое сопровождение сделок', price: 0, duration_min: 60 },
                { profile_id: svetlana.id, title: 'Составление и проверка юридических документов', price: 0, duration_min: 60 },
                { profile_id: svetlana.id, title: 'Услуги юристов по лицензированию', price: 0, duration_min: 60 },
                { profile_id: svetlana.id, title: 'Переводчики', price: 0, duration_min: 60 },
            ],
        });
    }

    console.log('✅ Seeded 3 master profiles with services:');
    console.log(`   • ${elena.name} → /salon/${elena.slug}`);
    console.log(`   • ${kseniya.name} → /salon/${kseniya.slug}`);
    console.log(`   • ${svetlana.name} → /salon/${svetlana.slug}`);
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
