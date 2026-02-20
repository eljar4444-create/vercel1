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

    if (!user) {
        redirect('/auth/login');
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-12 pt-24">
            <div className="container mx-auto max-w-4xl px-4">
                <AccountSettingsView user={user} />
            </div>
        </div>
    );
}
