import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const profiles = await prisma.profile.findMany();
    console.log(profiles.map(p => ({ id: p.id, name: p.name, city: p.city, address: p.address, lat: p.latitude, lng: p.longitude })));
}
main().finally(() => prisma.$disconnect());
