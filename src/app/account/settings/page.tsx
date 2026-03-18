import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { AccountSettingsView } from '@/components/AccountSettingsView';

export default async function AccountSettingsPage() {
    const session = await auth();

    if (!session?.user) {
        redirect('/auth/login');
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            id: true,
            name: true,
            email: true,
            image: true,
            bio: true,
        },
    });

    const latestPhoneBooking = await prisma.booking.findFirst({
        where: { user_id: session.user.id },
        orderBy: { created_at: 'desc' },
        select: { user_phone: true },
    });

    if (!user) {
        redirect('/auth/login');
    }

    // Use profile image as fallback when user has no avatar
    let resolvedImage = user.image;
    if (!resolvedImage) {
        const profile = await prisma.profile.findFirst({
            where: {
                OR: [
                    { user_id: session.user.id },
                    ...(session.user.email ? [{ user_email: session.user.email }] : []),
                ],
            },
            select: { image_url: true },
        });
        resolvedImage = profile?.image_url ?? null;
    }

    return (
        <div className="min-h-screen pb-12 pt-24">
            <div className="container mx-auto max-w-4xl px-4">
                <AccountSettingsView
                    user={{
                        ...user,
                        image: resolvedImage,
                        phone: latestPhoneBooking?.user_phone ?? null,
                    }}
                />
            </div>
        </div>
    );
}
