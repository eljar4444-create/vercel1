import prisma from "./src/lib/prisma"; async function main() { const p = await prisma.profile.findFirst({where: {slug: "eliar-mamedov-bayreuth"}}); console.log(p?.studioImages); } main();
