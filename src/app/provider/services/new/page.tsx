import { Suspense } from 'react';
import { AddServiceForm } from '@/components/dashboard/AddServiceForm';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';

export default async function CreateServicePage() {
    const session = await auth();
    if (!session?.user?.id) redirect('/auth/login');

    const profile = await prisma.profile.findFirst({
        where: { user_id: session.user.id },
        select: { id: true }
    });

    if (!profile) redirect('/onboarding');

    return (
        <Suspense fallback={<div className="flex justify-center items-center min-h-screen">Loading...</div>}>
            <AddServiceForm returnHref="/dashboard" />
        </Suspense>
    );
}
