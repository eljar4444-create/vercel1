import { Suspense } from 'react';
import { CreateServiceForm } from '@/components/provider/CreateServiceForm';
import prisma from '@/lib/prisma';

export default async function CreateServicePage() {
    const categories = await prisma.serviceCategory.findMany({
        select: { id: true, name: true, slug: true }
    });

    // Translate categories for display (Mock translation for now)
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
            <CreateServiceForm categories={displayCategories} cities={cities} />
        </Suspense>
    );
}
