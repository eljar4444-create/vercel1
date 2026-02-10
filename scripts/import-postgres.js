
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient({
    log: [], // Disable internal logs to see our errors clearly
});

const logFile = path.resolve(__dirname, 'import.log');
// Delete old log
if (fs.existsSync(logFile)) fs.unlinkSync(logFile);

function log(msg) {
    fs.appendFileSync(logFile, msg + '\n');
    process.stdout.write(msg + '\n');
}
console.log = log;
console.error = function (msg, err) {
    log(msg);
    if (err) {
        log(err.toString());
        if (err.meta) log(JSON.stringify(err.meta));
        if (err.code) log("Code: " + err.code);
    }
};

async function main() {
    log("Starting import script (JS version)...");
    try {
        await prisma.$connect();
        log("Connected to database successfully.");
    } catch (e) {
        log("Failed to connect to database: " + e);
        process.exit(1);
    }

    const dataPath = path.resolve(__dirname, 'data_dump.json');
    if (!fs.existsSync(dataPath)) {
        console.error('Data dump not found!');
        process.exit(1);
    }

    const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));


    // Helper to convert integer timestamps to Date objects
    const toDate = (val) => val ? new Date(parseInt(val)) : null;

    // Order of import is important to respect foreign keys
    console.log('Importing Users...');
    for (const user of data.User || []) {
        try {
            const exists = await prisma.user.findUnique({ where: { id: user.id } });
            if (!exists) {
                // Fix dates
                user.createdAt = toDate(user.createdAt) || new Date();
                user.updatedAt = toDate(user.updatedAt) || new Date();
                user.emailVerified = toDate(user.emailVerified);

                await prisma.user.create({ data: user });
                process.stdout.write('.');
            } else {
                process.stdout.write('s');
            }
        } catch (e) {
            console.error(`\nError importing user ${user.id}:`, e);
        }
    }
    console.log('\nUsers imported.');

    console.log('Importing Accounts...');
    for (const account of data.Account || []) {
        try {
            const exists = await prisma.account.findFirst({
                where: { provider: account.provider, providerAccountId: account.providerAccountId }
            });
            if (!exists) {
                // Fix dates
                account.createdAt = toDate(account.createdAt) || new Date();
                account.updatedAt = toDate(account.updatedAt) || new Date();
                // expires_at is Int, keep as is

                await prisma.account.create({ data: account });
                process.stdout.write('.');
            }
        } catch (e) {
            console.error(`\nError importing account ${account.id}:`, e.message);
        }
    }
    console.log('\nAccounts imported.');


    console.log('Importing Cities...');
    if (data.City) {
        for (const city of data.City) {
            try {
                const exists = await prisma.city.findUnique({ where: { id: city.id } });
                if (!exists) await prisma.city.create({ data: city });
            } catch (e) { }
        }
    }

    console.log('Importing ServiceCategories...');
    if (data.ServiceCategory) {
        for (const cat of data.ServiceCategory) {
            try {
                const exists = await prisma.serviceCategory.findUnique({ where: { id: cat.id } });
                if (!exists) await prisma.serviceCategory.create({ data: cat });
            } catch (e) { }
        }
    }

    console.log('Importing SubscriptionPlans...');
    if (data.SubscriptionPlan) {
        for (const plan of data.SubscriptionPlan) {
            try {
                const exists = await prisma.subscriptionPlan.findUnique({ where: { id: plan.id } });
                if (!exists) await prisma.subscriptionPlan.create({ data: plan });
            } catch (e) { console.error(`\nError importing plan ${plan.id}:`, e); }
        }
    }

    console.log('Importing ProviderProfiles...');
    if (data.ProviderProfile) {
        for (const profile of data.ProviderProfile) {
            try {
                const exists = await prisma.providerProfile.findUnique({ where: { id: profile.id } });
                if (!exists) {
                    await prisma.providerProfile.create({ data: profile });
                }
            } catch (e) {
                console.error(`\nError importing profile ${profile.id}:`, e.message);
            }
        }
    }


    console.log('Importing ProviderSubscriptions...');
    if (data.ProviderSubscription) {
        for (const sub of data.ProviderSubscription) {
            try {
                const exists = await prisma.providerSubscription.findUnique({ where: { id: sub.id } });
                if (!exists) {
                    sub.startsAt = toDate(sub.startsAt) || new Date();
                    sub.endsAt = toDate(sub.endsAt);
                    // Fix boolean (SQLite uses 0/1)
                    sub.isActive = sub.isActive === 1 || sub.isActive === true;

                    await prisma.providerSubscription.create({ data: sub });
                }
            } catch (e) { console.error(`\nError importing subscription ${sub.id}:`, e); }
        }
    }

    console.log('Importing Services...');
    if (data.Service) {
        for (const service of data.Service) {
            try {
                const exists = await prisma.service.findUnique({ where: { id: service.id } });
                if (!exists) {
                    service.createdAt = toDate(service.createdAt) || new Date();
                    service.updatedAt = toDate(service.updatedAt) || new Date();

                    await prisma.service.create({ data: service });
                }
            } catch (e) {
                console.error(`\nError importing service ${service.id}:`, e);
            }
        }
    }

    console.log('Importing ServiceImages...');
    if (data.ServiceImage) {
        for (const img of data.ServiceImage) {
            try {
                const exists = await prisma.serviceImage.findUnique({ where: { id: img.id } });
                if (!exists) {
                    img.createdAt = toDate(img.createdAt) || new Date();
                    await prisma.serviceImage.create({ data: img });
                }
            } catch (e) { }
        }
    }

    console.log('Importing Requests...');
    if (data.Request) {
        for (const req of data.Request) {
            try {
                const exists = await prisma.request.findUnique({ where: { id: req.id } });
                if (!exists) {
                    req.createdAt = toDate(req.createdAt) || new Date();
                    req.updatedAt = toDate(req.updatedAt) || new Date();
                    await prisma.request.create({ data: req });
                }
            } catch (e) { }
        }
    }

    console.log('Importing ChatMessages...');
    if (data.ChatMessage) {
        for (const msg of data.ChatMessage) {
            try {
                const exists = await prisma.chatMessage.findUnique({ where: { id: msg.id } });
                if (!exists) {
                    msg.createdAt = toDate(msg.createdAt) || new Date();
                    msg.isRead = msg.isRead === 1 || msg.isRead === true; // Fix boolean
                    await prisma.chatMessage.create({ data: msg });
                }
            } catch (e) { }
        }
    }

    console.log('Importing Orders...');
    if (data.Order) {
        for (const order of data.Order) {
            try {
                const exists = await prisma.order.findUnique({ where: { id: order.id } });
                if (!exists) {
                    order.createdAt = toDate(order.createdAt) || new Date();
                    order.updatedAt = toDate(order.updatedAt) || new Date();
                    await prisma.order.create({ data: order });
                }
            } catch (e) { }
        }
    }

    console.log('\nMigration completed successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
