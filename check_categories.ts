import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const categories = await prisma.serviceCategory.findMany();
    console.log('Categories in DB:', JSON.stringify(categories, null, 2));

    const services = await prisma.service.findMany({
        take: 5,
        include: { category: true }
    });
    console.log('Sample Services:', JSON.stringify(services, null, 2));
}

main()
    .catch(e => {
        throw e;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
