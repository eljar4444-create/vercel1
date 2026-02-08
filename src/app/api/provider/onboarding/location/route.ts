import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { z } from "zod";

const schema = z.object({
    address: z.string().min(5),
    city: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    serviceRadius: z.number().optional(),
});

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { address, city, latitude, longitude, serviceRadius } = schema.parse(body);

        const profile = await prisma.providerProfile.upsert({
            where: { userId: session.user.id },
            create: {
                userId: session.user.id!,
                address,
                city,
                latitude,
                longitude,
                serviceRadius: serviceRadius || 10,
                type: "PRIVATE", // Default
                rating: 0,
                reviewCount: 0,
                verificationStatus: "IDLE"
            },
            update: {
                address,
                city,
                latitude,
                longitude,
                serviceRadius
            },
        });

        // Ensure User role is PROVIDER
        const currentUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true }
        });

        if (currentUser?.role !== 'ADMIN' && currentUser?.role !== 'PROVIDER') {
            await prisma.user.update({
                where: { id: session.user.id },
                data: { role: 'PROVIDER' }
            });
        }

        return NextResponse.json({ success: true, profile });
    } catch (error: any) {
        console.error("Onboarding location error:", error);
        return NextResponse.json(
            { error: "Error updating location", details: error.message },
            { status: 500 }
        );
    }
}
