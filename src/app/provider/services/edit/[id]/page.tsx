import prisma from '@/lib/prisma';
import { Suspense } from 'react';
import { auth } from '@/auth';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { AddServiceForm } from '@/components/dashboard/AddServiceForm';
import { getTranslations } from 'next-intl/server';

export default async function EditServicePage({ params }: { params: { id: string } }) {
    const t = await getTranslations('dashboard.provider.servicesUi');
    const session = await auth();

    if (!session?.user?.email) {
        redirect('/auth/login');
    }

    // Find profile
    const profile = await prisma.profile.findUnique({
        where: { user_email: session.user.email },
        include: { category: true }
    });

    if (!profile) redirect('/dashboard');

    const serviceIdInt = parseInt(params.id);
    if (isNaN(serviceIdInt)) notFound();

    let service;
    try {
        service = await prisma.service.findUnique({
            where: { id: serviceIdInt }
        });
    } catch (e) {
        console.error("DB Error:", e);
    }

    if (!service) notFound();

    if (service.profile_id !== profile.id) {
        redirect('/dashboard?section=services');
    }

    return (
        <Suspense fallback={<div className="flex justify-center items-center min-h-screen">Loading...</div>}>
            <div className="container mx-auto px-4 py-8">
                <Link href="/dashboard?section=services" className="text-blue-600 hover:underline mb-6 inline-block">
                    &larr; {t('backToDashboard')}
                </Link>

                <AddServiceForm
                    serviceId={String(service.id)}
                    initialData={{
                        id: service.id,
                        title: service.title,
                        description: service.description,
                        price: Number(service.price),
                        duration_min: service.duration_min,
                        images: service.images,
                    }}
                    returnHref="/dashboard"
                />
            </div>
        </Suspense>
    );
}
