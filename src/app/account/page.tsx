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
        redirect('/provider/profile');
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        // include: {
        //     _count: {
        //         select: { orders: true }
        //     }
        // }
    });

    if (!user) {
        return <div>User not found</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 pt-24 pb-12">
            <div className="container mx-auto px-4 max-w-4xl">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Управление аккаунтом</h1>
                <AccountView user={user} />
            </div>
        </div>
    );
}
