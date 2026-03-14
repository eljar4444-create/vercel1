import { Suspense } from 'react';
import { AddServiceForm } from '@/components/dashboard/AddServiceForm';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';

export default async function CreateServicePage() {
    const session = await auth();
    if (!session) redirect('/auth/login');

    const profile = await prisma.profile.findFirst({
        where: {
            OR: [
                ...(session.user?.id ? [{ user_id: session.user.id }] : []),
                ...(session.user?.email ? [{ user_email: session.user.email }] : []),
            ],
        },
        select: { id: true },
    });

    return (
        <Suspense fallback={<div className="flex justify-center items-center min-h-screen">Loading...</div>}>
            <AddServiceForm returnHref={profile ? `/dashboard/${profile.id}` : '/dashboard'} />
        </Suspense>
    );
}
