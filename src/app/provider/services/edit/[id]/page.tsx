import { CreateServiceForm } from '@/components/provider/CreateServiceForm';
import prisma from '@/lib/prisma';
import { Suspense } from 'react';
import { auth } from '@/auth';
import { notFound, redirect } from 'next/navigation';

export default async function EditServicePage({ params }: { params: { id: string } }) {
    const session = await auth();

    if (!session?.user?.id) {
        redirect('/auth/login');
    }

    const service = await prisma.service.findUnique({
        where: { id: params.id },
        include: {
            providerProfile: true,
            photos: true
        }
    });

    if (!service) {
        notFound();
    }

    // Security check: Ensure the user owns this service
    if (service.providerProfile.userId !== session.user.id) {
        redirect('/provider/profile');
    }

    const categories = await prisma.serviceCategory.findMany({
        select: { id: true, name: true, slug: true }
    });

    const displayCategories = categories.map(c => ({
        ...c,
        name: c.slug === 'beauty' ? 'Красота и уход' :
            c.slug === 'plumbing' ? 'Сантехника' :
                c.slug === 'cleaning' ? 'Уборка' :
                    c.slug === 'electrician' ? 'Электрика' :
                        c.slug === 'repair' ? 'Ремонт' : c.name
    }));

    const cities = await prisma.city.findMany({
        select: { id: true, name: true, slug: true }
    });

    return (
        <Suspense fallback={<div className="flex justify-center items-center min-h-screen">Loading...</div>}>
            <CreateServiceForm
                categories={displayCategories}
                cities={cities}
                initialData={{
                    id: service.id,
                    title: service.title,
                    description: service.description,
                    price: service.price ?? 0,
                    categoryId: service.categoryId,
                    cityId: service.cityId,
                    subcategory: service.subcategory,
                    latitude: service.latitude,
                    longitude: service.longitude,
                    experience: service.experience,
                    equipment: service.equipment,
                    schedule: service.schedule,
                    workTime: service.workTime,
                    locationType: service.locationType,
                    priceList: service.priceList,
                    photos: service.photos
                }}
                serviceId={service.id}
            />
        </Suspense>
    );
}
