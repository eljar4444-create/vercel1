
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Database Counts:");
    try {
        const users = await prisma.user.count();
        console.log(`- Users: ${users}`);

        const categories = await prisma.category.count();
        console.log(`- Categories (New): ${categories}`);

        const profiles = await prisma.profile.count();
        console.log(`- Profiles: ${profiles}`);

        const directoryServices = await prisma.directoryService.count();
        console.log(`- DirectoryServices: ${directoryServices}`);

        const serviceCategories = await prisma.serviceCategory.count();
        console.log(`- ServiceCategories (Old/Legacy): ${serviceCategories}`);

        const providerProfiles = await prisma.providerProfile.count();
        console.log(`- ProviderProfiles: ${providerProfiles}`);

        const services = await prisma.service.count();
        console.log(`- Services: ${services}`);

        const requests = await prisma.request.count();
        console.log(`- Requests: ${requests}`);

        const orders = await prisma.order.count();
        console.log(`- Orders: ${orders}`);

        const cities = await prisma.city.count();
        console.log(`- Cities: ${cities}`);

    } catch (e) {
        console.error("Error counting:", e);
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
