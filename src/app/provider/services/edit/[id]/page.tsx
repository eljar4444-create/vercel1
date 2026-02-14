import { CreateServiceForm } from '@/components/provider/CreateServiceForm';
import prisma from '@/lib/prisma';
import { Suspense } from 'react';
import { auth } from '@/auth';
import { notFound, redirect } from 'next/navigation';

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

    let service;
    const serviceIdInt = parseInt(params.id);
    if (isNaN(serviceIdInt)) notFound();

    try {
        service = await prisma.directoryService.findUnique({
            where: { id: serviceIdInt }
        });
    } catch (e) {
        console.error("DB Error:", e);
    }

    if (!service) {
        notFound();
    }

    if (service.profile_id !== profile.id) {
        redirect('/provider/profile');
    }

    let categories: { id: string; name: string; slug: string }[] = [];
    let cities: { id: string; name: string; slug: string }[] = [];

    try {
        const categoriesRaw = await prisma.category.findMany({
            select: { id: true, name: true, slug: true }
        });
        categories = categoriesRaw.map(c => ({ ...c, id: c.id.toString() }));

        cities = await prisma.city.findMany({
            select: { id: true, name: true, slug: true }
        });
    } catch (e) {
        console.log("DB Load Error (meta)", e);
    }

    // Attempt to map profile city name to ID
    let cityId = "";
    if (profile.city) {
        const found = cities.find(c => c.name.toLowerCase() === profile.city?.toLowerCase());
        if (found) cityId = found.id;
    }

    // Transform photos JSON to array
    let photos: { id: string; url: string }[] = [];
    if (service.photos && Array.isArray(service.photos)) {
        photos = (service.photos as any[]).map((url: string, idx: number) => ({ id: `p-${idx}`, url }));
    }

    return (
        <Suspense fallback={<div className="flex justify-center items-center min-h-screen">Loading...</div>}>
            <CreateServiceForm
                categories={categories}
                cities={cities}
                initialData={{
                    id: service.id.toString(),
                    title: service.title,
                    description: service.description || "",
                    price: Number(service.price) || 0,
                    categoryId: profile.category_id.toString() || "",
                    cityId: cityId,
                    subcategory: service.subcategory,
                    latitude: service.latitude,
                    longitude: service.longitude,
                    experience: service.experience,
                    equipment: service.equipment,
                    schedule: service.schedule,
                    workTime: service.workTime,
                    locationType: service.locationType,
                    priceList: service.priceList,
                    photos: photos
                }}
                serviceId={service.id.toString()}
            />
        </Suspense>
    );
}
