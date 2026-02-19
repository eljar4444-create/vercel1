require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    const profiles = await prisma.profile.findMany({
        where: { user_id: null },
        select: { id: true, user_email: true },
    });

    let linked = 0;
    let skipped = 0;

    for (const profile of profiles) {
        if (!profile.user_email) {
            skipped += 1;
            continue;
        }

        const user = await prisma.user.findUnique({
            where: { email: profile.user_email },
            select: { id: true, role: true },
        });

        if (!user) {
            skipped += 1;
            continue;
        }

        await prisma.profile.update({
            where: { id: profile.id },
            data: { user_id: user.id },
        });

        if (user.role !== 'PROVIDER') {
            await prisma.user.update({
                where: { id: user.id },
                data: { role: 'PROVIDER' },
            });
        }

        linked += 1;
    }

    console.log(`Profiles linked: ${linked}`);
    console.log(`Profiles skipped: ${skipped}`);
}

main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
