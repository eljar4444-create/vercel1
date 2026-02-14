import { Suspense } from 'react';
import { CreateServiceForm } from '@/components/provider/CreateServiceForm';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function CreateServicePage() {
    const session = await auth();
    if (!session) redirect('/auth/login');

    // MOCK DATA FALLBACK if DB fails locally
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
        console.error("DB Load Error (likely local connection issue):", e);
        // Fallback for local dev without DB
        categories = [
            { id: '1', name: 'Красота', slug: 'beauty' },
            { id: '2', name: 'Ремонт', slug: 'repair' }
        ];
        cities = [];
    }

    return (
        <Suspense fallback={<div className="flex justify-center items-center min-h-screen">Loading...</div>}>
            <CreateServiceForm categories={categories} cities={cities} />
        </Suspense>
    );
}
