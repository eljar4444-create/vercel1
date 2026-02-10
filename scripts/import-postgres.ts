
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
});

async function main() {
    console.log("Starting import script...");
    try {
        await prisma.$connect();
        console.log("Connected to database successfully.");
    } catch (e) {
        console.error("Failed to connect to database:", e);
        process.exit(1);
    }
    const dataPath = path.resolve(__dirname, 'data_dump.json');
    if (!fs.existsSync(dataPath)) {
        console.error('Data dump not found!');
        process.exit(1);
    }

    const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

    // Order of import is important to respect foreign keys
    // 1. Users
    // 2. ServiceCategories / Cities
    // 3. ProviderProfiles (depends on User)
    // 4. Services (depends on ProviderProfile, Category, City)
    // 5. ... others

    console.log('Importing Users...');
    for (const user of data.User || []) {
        // Skip if exists
        const exists = await prisma.user.findUnique({ where: { id: user.id } });
        if (!exists) {
            await prisma.user.create({ data: user });
        }
    }

    console.log('Importing Accounts...');
    for (const account of data.Account || []) {
        const exists = await prisma.account.findFirst({
            where: { provider: account.provider, providerAccountId: account.providerAccountId }
        });
        if (!exists) {
            await prisma.account.create({ data: account });
        }
    }

    console.log('Importing Cities...');
    if (data.City) {
        for (const city of data.City) {
            const exists = await prisma.city.findUnique({ where: { id: city.id } });
            if (!exists) await prisma.city.create({ data: city });
        }
    }

    console.log('Importing ServiceCategories...');
    if (data.ServiceCategory) {
        for (const cat of data.ServiceCategory) {
            const exists = await prisma.serviceCategory.findUnique({ where: { id: cat.id } });
            if (!exists) await prisma.serviceCategory.create({ data: cat });
        }
    }

    console.log('Importing ProviderProfiles...');
    if (data.ProviderProfile) {
        for (const profile of data.ProviderProfile) {
            const exists = await prisma.providerProfile.findUnique({ where: { id: profile.id } });
            if (!exists) {
                // Remove internal SQLite specific fields if any, or ensure types match
                await prisma.providerProfile.create({ data: profile });
            }
        }
    }


    console.log('Importing Services...');
    if (data.Service) {
        for (const service of data.Service) {
            const exists = await prisma.service.findUnique({ where: { id: service.id } });
            if (!exists) {
                // Ensure decimal/float compatibility if needed
                await prisma.service.create({ data: service });
            }
        }
    }

    console.log('Importing ServiceImages...');
    if (data.ServiceImage) {
        for (const img of data.ServiceImage) {
            const exists = await prisma.serviceImage.findUnique({ where: { id: img.id } });
            if (!exists) await prisma.serviceImage.create({ data: img });
        }
    }

    console.log('Importing Requests...');
    if (data.Request) {
        for (const req of data.Request) {
            const exists = await prisma.request.findUnique({ where: { id: req.id } });
            if (!exists) await prisma.request.create({ data: req });
        }
    }

    console.log('Importing ChatMessages...');
    if (data.ChatMessage) {
        for (const msg of data.ChatMessage) {
            const exists = await prisma.chatMessage.findUnique({ where: { id: msg.id } });
            if (!exists) await prisma.chatMessage.create({ data: msg });
        }
    }

    console.log('Importing Orders...');
    if (data.Order) {
        for (const order of data.Order) {
            const exists = await prisma.order.findUnique({ where: { id: order.id } });
            if (!exists) await prisma.order.create({ data: order });
        }
    }

    console.log('Migration completed successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
