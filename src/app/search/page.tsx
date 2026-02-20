export const dynamic = 'force-dynamic';
export const revalidate = 0;

import prisma from "@/lib/prisma";
import Link from "next/link";
import { ProfileCard } from "@/components/ProfileCard";
import { Search, MapPin, SlidersHorizontal, Sparkles, Stethoscope, X } from "lucide-react";
import { SearchFiltersForm } from "@/components/search/SearchFiltersForm";

// ─── Category visual config ─────────────────────────────────────────
const CAT_CONFIG: Record<string, {
    icon: string;
    color: string;
    bg: string;
    border: string;
    activeBg: string;
    activeText: string;
}> = {
    beauty: {
        icon: '💅',
        color: 'text-rose-600',
        bg: 'bg-rose-50',
        border: 'border-rose-200',
        activeBg: 'bg-rose-600',
        activeText: 'text-white',
    },
    health: {
        icon: '🩺',
        color: 'text-teal-600',
        bg: 'bg-teal-50',
        border: 'border-teal-200',
        activeBg: 'bg-teal-600',
        activeText: 'text-white',
    },
};

const DEFAULT_CAT = {
    icon: '📋',
    color: 'text-gray-600',
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    activeBg: 'bg-gray-800',
    activeText: 'text-white',
};

export default async function SearchPage({
    searchParams,
}: {
    searchParams: { [key: string]: string | string[] | undefined };
}) {
    const categoryFilter = typeof searchParams.category === 'string' ? searchParams.category : undefined;
    const cityFilter = typeof searchParams.city === 'string' ? searchParams.city : undefined;
    const queryFilter = typeof searchParams.q === 'string' ? searchParams.q : undefined;

    // ─── Fetch categories ───────────────────────────────────────────
    let categories: { id: number; name: string; slug: string; icon: string | null }[] = [];
    try {
        categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
    } catch { /* fallback to empty */ }

    // ─── Build the profile "where" clause ───────────────────────────
    const where: any = {
        is_verified: true, // Only show verified profiles
    };

    if (categoryFilter) {
        const cat = categories.find(c => c.slug === categoryFilter);
        if (cat) where.category_id = cat.id;
    }

    if (cityFilter) {
        where.city = { contains: cityFilter, mode: 'insensitive' };
    }

    if (queryFilter) {
        where.OR = [
            { name: { contains: queryFilter, mode: 'insensitive' } },
            { city: { contains: queryFilter, mode: 'insensitive' } },
            { category: { name: { contains: queryFilter, mode: 'insensitive' } } },
            {
                services: {
                    some: {
                        title: { contains: queryFilter, mode: 'insensitive' },
                    },
                },
            },
        ];
    }

    // ─── Fetch profiles ─────────────────────────────────────────────
    let profiles: any[] = [];
    try {
        profiles = await prisma.profile.findMany({
            where,
            include: {
                category: true,
                services: true,
            },
            orderBy: { created_at: 'desc' },
            take: 50,
        });
    } catch (e: any) {
        console.error("DB Error:", e);
    }

    // ─── Active category info ───────────────────────────────────────
    const activeCat = categories.find(c => c.slug === categoryFilter);
    const activeCatConfig = categoryFilter ? (CAT_CONFIG[categoryFilter] || DEFAULT_CAT) : null;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* ═══════════════════════════════════════════════════════ */}
            {/* HERO HEADER                                            */}
            {/* ═══════════════════════════════════════════════════════ */}
            <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 pt-8 pb-16">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1600607686527-6fb886090705?q=80&w=2700&auto=format&fit=crop')] bg-cover bg-center opacity-10" />

                <div className="container mx-auto px-4 max-w-6xl relative z-10">
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
                        <Link href="/" className="hover:text-white transition-colors">Главная</Link>
                        <span>/</span>
                        <span className="text-white">Поиск</span>
                        {activeCat && (
                            <>
                                <span>/</span>
                                <span className="text-white">{activeCat.name}</span>
                            </>
                        )}
                    </div>

                    {/* Title */}
                    <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">
                        {activeCat ? activeCat.name : 'Все специалисты'}
                    </h1>
                    <p className="text-gray-400 text-lg mb-8">
                        {profiles.length > 0
                            ? `Найдено ${profiles.length} ${profiles.length === 1 ? 'специалист' : profiles.length < 5 ? 'специалиста' : 'специалистов'}`
                            : 'Специалисты не найдены'}
                        {cityFilter && <span> в городе <strong className="text-white">{cityFilter}</strong></span>}
                    </p>

                    {/* ── Search / Filter Bar ── */}
                    <SearchFiltersForm
                        categoryFilter={categoryFilter}
                        queryFilter={queryFilter}
                        cityFilter={cityFilter}
                    />
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════ */}
            {/* FILTER PILLS + RESULTS                                 */}
            {/* ═══════════════════════════════════════════════════════ */}
            <section className="container mx-auto px-4 max-w-6xl py-8">
                {/* Category Pills */}
                <div className="flex flex-wrap items-center gap-2 mb-8">
                    {/* "All" pill */}
                    <Link
                        href="/search"
                        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium border transition-all duration-200 hover:shadow-md ${!categoryFilter
                            ? 'bg-gray-900 text-white border-gray-900 shadow-md'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                            }`}
                    >
                        Все
                    </Link>

                    {categories.map(cat => {
                        const config = CAT_CONFIG[cat.slug] || DEFAULT_CAT;
                        const isActive = categoryFilter === cat.slug;
                        return (
                            <Link
                                key={cat.slug}
                                href={`/search?category=${cat.slug}${cityFilter ? `&city=${cityFilter}` : ''}`}
                                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium border transition-all duration-200 hover:shadow-md ${isActive
                                    ? `${config.activeBg} ${config.activeText} border-transparent shadow-md`
                                    : `bg-white ${config.color} ${config.border} hover:${config.bg}`
                                    }`}
                            >
                                {cat.icon || config.icon}
                                {cat.name}
                            </Link>
                        );
                    })}

                    {/* Active filter badges */}
                    {(cityFilter || queryFilter) && (
                        <div className="ml-auto flex items-center gap-2">
                            {cityFilter && (
                                <Link
                                    href={`/search${categoryFilter ? `?category=${categoryFilter}` : ''}`}
                                    className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-xs font-medium border border-blue-200 hover:bg-blue-100 transition-colors"
                                >
                                    <MapPin className="w-3 h-3" />
                                    {cityFilter}
                                    <X className="w-3 h-3 ml-1" />
                                </Link>
                            )}
                            {queryFilter && (
                                <Link
                                    href={`/search${categoryFilter ? `?category=${categoryFilter}` : ''}${cityFilter ? `${categoryFilter ? '&' : '?'}city=${cityFilter}` : ''}`}
                                    className="inline-flex items-center gap-1.5 bg-purple-50 text-purple-700 px-3 py-1.5 rounded-full text-xs font-medium border border-purple-200 hover:bg-purple-100 transition-colors"
                                >
                                    <Search className="w-3 h-3" />
                                    «{queryFilter}»
                                    <X className="w-3 h-3 ml-1" />
                                </Link>
                            )}
                        </div>
                    )}
                </div>

                {/* ── Results Grid ── */}
                {profiles.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {profiles.map((profile: any) => (
                            <ProfileCard key={profile.id} profile={profile} />
                        ))}
                    </div>
                ) : (
                    /* ── Empty State ── */
                    <div className="text-center py-20">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Search className="w-10 h-10 text-gray-300" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Специалисты не найдены</h3>
                        <p className="text-gray-500 mb-6 max-w-md mx-auto">
                            Попробуйте изменить фильтры или посмотрите все доступные категории
                        </p>
                        <Link
                            href="/search"
                            className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200"
                        >
                            Сбросить фильтры
                        </Link>
                    </div>
                )}

                {/* ── Results count footer ── */}
                {profiles.length > 0 && (
                    <div className="text-center mt-12 text-sm text-gray-400">
                        Показано {profiles.length} из {profiles.length} результатов
                    </div>
                )}
            </section>
        </div>
    );
}
