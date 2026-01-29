import { CreateServiceForm } from '@/components/provider/CreateServiceForm';
import prisma from '@/lib/prisma';
import { Suspense } from 'react';

export default async function OnboardingServicePage() {
    // Fetch categories and cities for the form
    const categories = await prisma.serviceCategory.findMany({
        select: { id: true, name: true, slug: true }
    });

    // Translate categories for display (Consistent with other pages)
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
        <div className="min-h-screen bg-gray-50">
            {/* Reuse the form but we might want to wrap it or adjust header if needed.
                 The form itself has a header "Link to /".
                 In onboarding, maybe we want slightly different header?
                 But for reusing logic, let's keep it simple.
                 The CreateServiceForm component is self-contained with layout.
              */}
            <Suspense fallback={<div className="flex justify-center items-center min-h-screen">Loading...</div>}>
                <CreateServiceForm categories={displayCategories} cities={cities} />
            </Suspense>
        </div>
    );
}
