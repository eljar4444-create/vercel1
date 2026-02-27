'use server';

import prisma from '@/lib/prisma';

export async function getHomeStats() {
    try {
        const masters = await prisma.profile.count();
        const services = await prisma.service.count();
        return { masters, services };
    } catch (error) {
        console.error('Error fetching home stats:', error);
        return { masters: 0, services: 0 };
    }
}
