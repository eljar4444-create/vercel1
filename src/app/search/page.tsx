
import { Button } from '@/components/ui/button';
import { Search, LayoutGrid, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import prisma from '@/lib/prisma';
import { ServiceCard } from '@/components/ServiceCard';

// Categories Configuration (Same as before)
// Categories Configuration (Updated to match DB seeds)
import { CATEGORIES, SUB_CATEGORIES } from '@/constants/categories';

export default async function SearchPage({
    searchParams
}: {
    searchParams: {
        category?: string;
        subcategory?: string;
        q?: string;
        location?: string;
        lat?: string;
        lng?: string;
        radius?: string;
    }
}) {
    const categoryId = searchParams.category;
    const subcategory = searchParams.subcategory;
    const query = searchParams.q;

    // Determine current View Step
    // Step 1: No category -> Show Categories List
    // Step 2: Category selected -> Show Subcategories
    // Step 3: Subcategory selected -> Show Services

    // Unified View Steps
    // Step 1: No category -> Show Categories List
    // Step 2: Category selected -> Show Services with Subcategory Chips

    const viewStep = categoryId ? 2 : 1;

    // Data Fetching for Step 2 (Results)
    let services: any[] = [];
    if (viewStep === 2) {
        const whereClause: any = {
            status: 'APPROVED',
            category: {
                slug: categoryId
            }
        };

        if (subcategory) {
            // Check implicit subcategory field OR title/desc matches
            whereClause.OR = [
                { subcategory: subcategory }, // Direct match
                { title: { contains: subcategory } },
                { description: { contains: subcategory } },
            ];
        }

        // Fetch raw services first, then filter by location in memory (SQLite limitation)
        let rawServices = await prisma.service.findMany({
            where: whereClause,
            include: {
                providerProfile: {
                    include: { user: true }
                },
                category: true,
                city: true
            }
        });

        // Filter by Location if coordinates provided
        const lat = searchParams.lat ? parseFloat(searchParams.lat) : null;
        const lng = searchParams.lng ? parseFloat(searchParams.lng) : null;
        const radius = searchParams.radius ? parseFloat(searchParams.radius) : 10; // default 10km

        if (lat && lng) {
            services = rawServices.filter(service => {
                if (!service.latitude || !service.longitude) return false;

                // Simple Haversine implementation
                const R = 6371; // Earth radius in km
                const dLat = (service.latitude - lat) * Math.PI / 180;
                const dLon = (service.longitude - lng) * Math.PI / 180;
                const a =
                    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                    Math.cos(lat * Math.PI / 180) * Math.cos(service.latitude * Math.PI / 180) *
                    Math.sin(dLon / 2) * Math.sin(dLon / 2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                const distance = R * c;

                return distance <= radius;
            });
        } else if (searchParams.location) {
            // Fallback: Filter by city name OR slug text match if no coordinates
            const locLower = searchParams.location.toLowerCase();
            services = rawServices.filter(service =>
                service.city?.name.toLowerCase().includes(locLower) ||
                service.city?.slug?.toLowerCase().includes(locLower)
            );
        } else {
            services = rawServices;
        }
    }

    // Map category ID to Name
    const categoryName = CATEGORIES.find(c => c.id === categoryId)?.name;
    const currentSubcategories = categoryId ? (SUB_CATEGORIES[categoryId] || []) : [];

    return (
        <div className="container mx-auto px-4 max-w-7xl flex items-start gap-8 font-sans text-slate-900">
            {/* Sidebar (Left) */}
            <aside className="w-64 hidden lg:flex flex-col py-8 shrink-0">
                <nav className="space-y-6 text-gray-500 font-medium text-[15px] shrink-0">
                    <Link href="/search" className={cn("flex items-center gap-3 px-4 py-2 rounded-lg transition-colors", !categoryId ? "text-black font-bold bg-gray-50 -mx-4" : "hover:text-black")}>
                        <LayoutGrid className="w-5 h-5" />
                        Найти специалиста
                    </Link>
                    <Link href="/my-orders" className="flex items-center gap-3 hover:text-black transition-colors">
                        <CheckCircle2 className="w-5 h-5" />
                        Мои заказы
                    </Link>
                    <Link href="/become-provider" className="flex items-center gap-3 hover:text-black transition-colors">
                        <div className="w-5 h-5 border-2 border-current rounded-full flex items-center justify-center text-[10px] font-bold">🛠</div>
                        Стать исполнителем
                    </Link>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 py-8">

                <div className="p-8 max-w-7xl mx-auto">
                    {/* View 1: Categories Grid */}
                    {viewStep === 1 && (
                        <div>
                            <h1 className="text-3xl font-bold mb-8">Выберите категорию</h1>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {CATEGORIES.map(cat => (
                                    <Link key={cat.id} href={`/search?category=${cat.id}`} className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center gap-4 group border border-transparent hover:border-blue-100">
                                        <div className="text-4xl group-hover:scale-110 transition-transform duration-300">{cat.icon}</div>
                                        <span className="font-bold text-lg group-hover:text-blue-600 transition-colors">{cat.name}</span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* View 2: Services List (with Subcategory Chips) */}
                    {viewStep === 2 && (
                        <div>
                            <div className="mb-6">
                                <Link href="/search" className="text-gray-400 hover:text-black flex items-center gap-2 text-sm font-medium mb-4">
                                    <ArrowLeft className="w-4 h-4" /> Все категории
                                </Link>
                                <div className="flex flex-col gap-4">
                                    <div>
                                        <h1 className="text-3xl font-bold">{subcategory || categoryName}</h1>
                                        <p className="text-gray-500 mt-2">
                                            Найдено {services.length} исполнителей
                                            {subcategory && ` по запросу "${subcategory}"`}
                                        </p>
                                    </div>

                                    {/* Subcategory Chips */}
                                    {currentSubcategories.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            <Link
                                                href={`/search?category=${categoryId}`}
                                                className={cn(
                                                    "px-4 py-2 rounded-full text-sm font-medium transition-colors border",
                                                    !subcategory
                                                        ? "bg-black text-white border-black"
                                                        : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                                                )}
                                            >
                                                Все
                                            </Link>
                                            {currentSubcategories.map(sub => (
                                                <Link
                                                    key={sub}
                                                    href={`/search?category=${categoryId}&subcategory=${encodeURIComponent(sub)}`}
                                                    className={cn(
                                                        "px-4 py-2 rounded-full text-sm font-medium transition-colors border",
                                                        subcategory === sub
                                                            ? "bg-black text-white border-black"
                                                            : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                                                    )}
                                                >
                                                    {sub}
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {services.map(service => (
                                    <ServiceCard
                                        key={service.id}
                                        service={{
                                            ...service,
                                            category: service.category.name,
                                            city: service.city?.name || '',
                                            provider: {
                                                name: service.providerProfile.user.name || '',
                                                email: service.providerProfile.user.email || ''
                                            }
                                        }}
                                    />
                                ))}
                                {services.length === 0 && (
                                    <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-gray-200">
                                        <p className="text-gray-500 text-lg">Нет услуг по выбранным параметрам</p>
                                        <Link href="/create-order">
                                            <Button className="mt-4">Создать заказ</Button>
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
