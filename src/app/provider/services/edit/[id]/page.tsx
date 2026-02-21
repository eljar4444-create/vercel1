import prisma from '@/lib/prisma';
import { Suspense } from 'react';
import { auth } from '@/auth';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { CreateServiceForm } from '@/components/provider/CreateServiceForm';

export default async function EditServicePage({ params }: { params: { id: string } }) {
    const session = await auth();

    if (!session?.user?.email) {
        redirect('/auth/login');
    }

    // Find profile
    const profile = await prisma.profile.findUnique({
        where: { user_email: session.user.email },
        include: { category: true }
    });

    if (!profile) redirect('/provider/profile');

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
        redirect('/provider/profile');
    }

    return (
        <Suspense fallback={<div className="flex justify-center items-center min-h-screen">Loading...</div>}>
            <div className="container mx-auto px-4 py-8">
                <Link href="/provider/profile" className="text-blue-600 hover:underline mb-6 inline-block">
                    &larr; Назад к профилю
                </Link>

                <CreateServiceForm
                    serviceId={String(service.id)}
                    initialData={{
                        id: service.id,
                        title: service.title,
                        description: service.description,
                        price: Number(service.price),
                        duration_min: service.duration_min,
                        images: service.images,
                    }}
                />
            </div>
        </Suspense>
    );
}
