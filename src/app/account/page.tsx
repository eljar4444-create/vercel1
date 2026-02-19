import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { AccountView } from '@/components/AccountView';

export default async function AccountPage() {
    const session = await auth();
    if (!session?.user) {
        redirect('/auth/login');
    }

    if (session.user.role === 'PROVIDER') {
        const providerProfile = await prisma.profile.findFirst({
            where: {
                OR: [
                    { user_id: session.user.id },
                    ...(session.user.email ? [{ user_email: session.user.email }] : []),
                ],
            },
            select: { id: true },
        });

        if (providerProfile) {
            redirect(`/dashboard/${providerProfile.id}`);
        }

        redirect('/become-pro');
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
    });

    if (!user) {
        return <div>User not found</div>;
    }

    const totalBookings = await prisma.booking.count({
        where: { user_id: session.user.id },
    });

    const upcomingBookings = await prisma.booking.count({
        where: {
            user_id: session.user.id,
            status: { in: ['pending', 'confirmed'] },
            date: { gte: new Date(new Date().toDateString()) },
        },
    });

    return (
        <div className="min-h-screen bg-gray-50 pt-24 pb-12">
            <div className="container mx-auto px-4 max-w-4xl">
                <AccountView
                    user={user}
                    stats={{
                        totalBookings,
                        upcomingBookings,
                    }}
                />
            </div>
        </div>
    );
}
