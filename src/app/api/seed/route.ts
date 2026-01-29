import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { CATEGORIES, SUB_CATEGORIES } from '@/constants/categories';

// Simple API Key protection to prevent public abuse
const SEED_SECRET = 'temp-seed-key-123';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');

    if (key !== SEED_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        console.log('🔄 Syncing Categories...');
        const results = [];

        for (const cat of CATEGORIES) {
            // Upsert categories
            const result = await prisma.serviceCategory.upsert({
                where: { slug: cat.id },
                update: {
                    name: cat.name,
                    slug: cat.id
                },
                create: {
                    name: cat.name,
                    slug: cat.id,
                }
            });
            results.push(`Synced Category: ${cat.name}`);
        }

        // --- Migrate Specific Provider & Service (Emil) ---

        // 1. Ensure City exists (Munich/Berlin)
        const berlin = await prisma.city.upsert({
            where: { slug: 'berlin' },
            update: {},
            create: { name: 'Берлин', slug: 'berlin' }
        });
        results.push('Synced City: Berlin');

        // 2. Upsert User (Emil)
        const emilUser = await prisma.user.upsert({
            where: { email: 'emil.m@gmail.com' },
            update: {},
            create: {
                name: 'Emil mamedov',
                email: 'emil.m@gmail.com',
                password: '$2a$10$Yulmy7m6YqCIcd3zPwcPjO3UawbODfumG6pxqlqccijJ5aqmOnDAi', // Hashed password from local
                role: 'ADMIN', // Promoted to ADMIN to view dashboard
                image: '/uploads/1769205404137_1759441547337.jpeg'
            }
        });
        results.push('Synced User: Emil (ADMIN)');

        // 3. Upsert Provider Profile
        const emilProfile = await prisma.providerProfile.upsert({
            where: { userId: emilUser.id },
            update: {},
            create: {
                userId: emilUser.id,
                bio: 'Я мастер по ремонту ',
                type: 'PRIVATE',
                address: 'Мюнхен, Германия',
                latitude: 48.1351253,
                longitude: 11.5819806,
                serviceRadius: 10
            }
        });
        results.push('Synced Profile: Emil');

        // 4. Upsert Service (Plumbing)
        const plumbingCat = await prisma.serviceCategory.findUnique({ where: { slug: 'plumbing' } });

        if (plumbingCat) {
            // Cleanup duplicates: Delete all services for this provider first
            await prisma.service.deleteMany({
                where: { providerProfileId: emilProfile.id }
            });
            results.push('Deleted old services (cleanup)');

            const service = await prisma.service.create({
                data: {
                    title: 'Сантехника ',
                    description: 'Устраняю засоры в трубах ',
                    status: 'APPROVED',
                    price: 0,
                    locationType: 'У клиента',
                    schedule: 'Пн - Пт',
                    workTime: '09:00 - 18:00',
                    experience: 1,
                    subcategory: JSON.stringify([{ name: "устранение засоров", isCustom: true, price: "", priceType: "agreement" }]),
                    providerProfileId: emilProfile.id,
                    categoryId: plumbingCat!.id,
                    cityId: berlin.id,
                    latitude: 49.94319466253201,
                    longitude: 11.57313338955711
                }
            });
            results.push('Synced Service: Сантехника (APPROVED)');
        }

        return NextResponse.json({
            success: true,
            version: 'v4-fix-duplicates',
            message: 'Data synced successfully',
            details: results
        });
    } catch (error) {
        console.error('Seed Error:', error);
        return NextResponse.json({ error: 'Failed to seed', details: String(error) }, { status: 500 });
    }
}
