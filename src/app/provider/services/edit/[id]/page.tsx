import prisma from '@/lib/prisma';
import { Suspense } from 'react';
import { auth } from '@/auth';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';

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

    let categories: { id: string; name: string; slug: string }[] = [];
    try {
        const categoriesRaw = await prisma.category.findMany({
            select: { id: true, name: true, slug: true }
        });
        categories = categoriesRaw.map(c => ({ ...c, id: c.id.toString() }));
    } catch (e) {
        console.log("DB Load Error (meta)", e);
    }

    return (
        <Suspense fallback={<div className="flex justify-center items-center min-h-screen">Loading...</div>}>
            <div className="container mx-auto px-4 py-8 max-w-2xl">
                <Link href="/provider/profile" className="text-blue-600 hover:underline mb-6 inline-block">
                    &larr; Назад к профилю
                </Link>

                <h1 className="text-2xl font-bold text-gray-900 mb-6">Редактировать услугу</h1>

                <form action={`/api/services/${service.id}/update`} method="POST" className="space-y-6 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Название</label>
                        <input
                            name="title"
                            type="text"
                            defaultValue={service.title}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Цена (€)</label>
                        <input
                            name="price"
                            type="number"
                            step="0.01"
                            defaultValue={Number(service.price)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Длительность (мин)</label>
                        <input
                            name="duration_min"
                            type="number"
                            defaultValue={service.duration_min}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors"
                    >
                        Сохранить изменения
                    </button>
                </form>
            </div>
        </Suspense>
    );
}
