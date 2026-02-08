import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
    bio: z.string().min(10, "Расскажите о себе немного подробнее"),
    imageUrl: z.string().optional(),
});

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { bio, imageUrl } = schema.parse(body);

        // Update User image
        if (imageUrl) {
            await prisma.user.update({
                where: { id: session.user.id },
                data: { image: imageUrl },
            });
        }

        // Update Provider bio (Upsert to ensure it exists)
        await prisma.providerProfile.upsert({
            where: { userId: session.user.id },
            create: {
                userId: session.user.id!,
                bio,
                type: "PRIVATE", // Default if missing
                rating: 0,
                reviewCount: 0,
                verificationStatus: "IDLE"
            },
            update: { bio },
        });

        // Ensure User role is PROVIDER (Just in case)
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

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Profile update error:", error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
        }
        return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }
}
