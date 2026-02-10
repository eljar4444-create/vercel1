
console.log("Starting debug script...");
const path = require('path');
const fs = require('fs');

try {
    require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
    console.log("Dotenv loaded.");
} catch (e) {
    console.error("Dotenv failed:", e);
}

try {
    const { PrismaClient } = require('@prisma/client');
    console.log("Prisma Client imported.");

    const prisma = new PrismaClient({
        log: ['info', 'warn', 'error'],
    });
    console.log("Prisma Client instantiated.");

    async function main() {
        console.log("Connecting to DB...");
        try {
            await prisma.$connect();
            console.log("Connected to DB successfully!");

            const users = await prisma.user.count();
            console.log(`Users in DB: ${users}`);
        } catch (e) {
            console.error("Connection failed:", e);
        } finally {
            await prisma.$disconnect();
            console.log("Disconnected.");
        }
    }

    main();
} catch (e) {
    console.error("Prisma failed:", e);
}
