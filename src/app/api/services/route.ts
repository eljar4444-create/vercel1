import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const q = searchParams.get('q');
        const category = searchParams.get('category'); // Expected to be Name or Slug
        const city = searchParams.get('city'); // Expected to be Name or Slug

        const where: any = {
            status: { not: 'PAYMENT_PENDING' }
        };

        if (q) {
            where.OR = [
                { title: { contains: q } },
                { description: { contains: q } },
            ];
        }

        if (category) {
            where.category = {
                OR: [
                    { name: category },
                    { slug: category.toLowerCase() }
                ]
            };
        }

        if (city) {
            where.city = {
                OR: [
                    { name: city },
                    { slug: city.toLowerCase() }
                ]
            };
        }

        const services = await prisma.service.findMany({
            where,
            include: {
                providerProfile: {
                    include: {
                        user: {
                            select: { name: true, email: true }
                        }
                    }
                },
                category: true,
                city: true,
            },
            orderBy: { createdAt: 'desc' }
        });

        // Transform for frontend if needed, or update frontend to handle deep structure
        const flattened = services.map(s => ({
            id: s.id,
            title: s.title,
            description: s.description,
            price: s.price,
            category: s.category.name,
            city: s.city.name,
            provider: s.providerProfile.user
        }));

        return NextResponse.json({ services: flattened });

    } catch (error) {
        console.error('Search API error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
