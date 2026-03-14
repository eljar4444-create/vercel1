'use server';

import prisma from '@/lib/prisma';

export type OnboardingCategoryOption = {
    id: number;
    name: string;
    slug: string;
};

export async function getOnboardingCategories(): Promise<OnboardingCategoryOption[]> {
    return prisma.category.findMany({
        select: {
            id: true,
            name: true,
            slug: true,
        },
        orderBy: {
            name: 'asc',
        },
    });
}
