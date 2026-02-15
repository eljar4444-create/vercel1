import prisma from '@/lib/prisma';
import Link from 'next/link';
import { SearchBar } from '@/components/search-bar';
import { ProfileCard } from '@/components/ProfileCard';
import { Search, Sparkles, Stethoscope } from 'lucide-react';

/* ─────────────────────────────────────────────
   SSR on every request — never serve stale cache
   ───────────────────────────────────────────── */
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/* ── Fallback categories (if DB unreachable) ── */
const FALLBACK_CATEGORIES = [
    { id: 1, slug: 'beauty', name: 'Красота и Уход' },
    { id: 2, slug: 'health', name: 'Медицина и Врачи' },
];

const CATEGORY_STYLE: Record<string, { icon: React.ReactNode }> = {
    beauty: { icon: <Sparkles className="w-4 h-4 text-rose-400" /> },
    health: { icon: <Stethoscope className="w-4 h-4 text-teal-500" /> },
};

/* ══════════════════════════════════════════════
   SEARCH PAGE — Server Component
   ══════════════════════════════════════════════ */
export default async function SearchPage({
    searchParams,
}: {
    searchParams: { [key: string]: string | string[] | undefined };
}) {
    const categorySlug = typeof searchParams.category === 'string' ? searchParams.category : undefined;
    const query = typeof searchParams.q === 'string' ? searchParams.q : undefined;

    // ── Debug: log incoming params ──
    console.log('──── /search HIT ────');
    console.log('Search Params:', JSON.stringify(searchParams));
    console.log('categorySlug:', categorySlug, '| query:', query);

    let profiles: any[] = [];
    let categories = FALLBACK_CATEGORIES;

    try {
        /* ── Build WHERE clause dynamically ── */
        const where: any = {};

        // Filter by category slug if provided
        if (categorySlug) {
            where.category = { slug: categorySlug };
        }

        // Text search across name, city, service titles
        if (query && query.trim().length > 0) {
            where.OR = [
                { name: { contains: query, mode: 'insensitive' } },
                { city: { contains: query, mode: 'insensitive' } },
                { services: { some: { title: { contains: query, mode: 'insensitive' } } } },
            ];
        }

        // ★ KEY: If no filters at all → show ALL profiles (no empty where = return everything)
        // Prisma with empty `where: {}` returns all rows — that's exactly what we want.

        console.log('Prisma WHERE:', JSON.stringify(where));

        profiles = await prisma.profile.findMany({
            where,
            include: {
                category: true,
                services: true,
            },
            orderBy: { created_at: 'desc' },
            take: 50, // Safety limit
        });

        console.log('Profiles found in DB:', profiles.length);

        // Also load categories for filter pills
        const dbCategories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
        if (dbCategories.length > 0) {
            categories = dbCategories.map((c: any) => ({
                id: c.id,
                slug: c.slug,
                name: c.name,
            }));
        }
        console.log('Categories loaded:', categories.length);
    } catch (err) {
        console.error('❌ DB ERROR on /search:', err);
        // DB unreachable — show empty state gracefully
    }

    /* ── Page title logic ── */
    const activeCategoryName = categorySlug
        ? categories.find(c => c.slug === categorySlug)?.name || categorySlug
        : null;

    const pageTitle = activeCategoryName
        ? activeCategoryName
        : query
            ? `Результаты: "${query}"`
            : 'Все специалисты';

    /* ══════════════════
       RENDER
       ══════════════════ */
    return (
        <div className="bg-[#f5f5f7] min-h-screen">
            {/* ── Search Header ── */}
            <div className="bg-white border-b border-gray-100">
                <div className="container mx-auto px-4 max-w-6xl py-8">
                    <SearchBar defaultQuery={query || ''} className="max-w-2xl mx-auto mb-6" />

                    {/* Category Filter Pills */}
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                        <Link
                            href="/search"
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
                                ${!categorySlug
                                    ? 'bg-gray-900 text-white shadow-md'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            Все
                        </Link>
                        {categories.map(cat => {
                            const isActive = categorySlug === cat.slug;
                            const style = CATEGORY_STYLE[cat.slug];
                            return (
                                <Link
                                    key={cat.slug}
                                    href={`/search?category=${cat.slug}`}
                                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
                                        ${isActive
                                            ? 'bg-gray-900 text-white shadow-md'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    {style?.icon}
                                    {cat.name}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ── Results ── */}
            <div className="container mx-auto px-4 max-w-6xl py-10">
                {/* Heading */}
                <div className="mb-8">
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                        {pageTitle}
                    </h1>
                    <p className="text-gray-500 mt-1">
                        {profiles.length > 0
                            ? `Найдено ${profiles.length} ${profiles.length === 1
                                ? 'специалист'
                                : profiles.length < 5
                                    ? 'специалиста'
                                    : 'специалистов'}`
                            : 'Пока нет результатов'
                        }
                    </p>
                </div>

                {/* Results Grid or Empty State */}
                {profiles.length === 0 ? (
                    <div className="bg-white rounded-2xl p-16 text-center shadow-sm border border-gray-100">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Search className="w-10 h-10 text-gray-300" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                            Пока нет мастеров
                        </h3>
                        <p className="text-gray-500 max-w-md mx-auto mb-8">
                            Мы активно привлекаем новых специалистов. Скоро здесь появятся профессионалы, которые говорят на вашем языке.
                        </p>
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-medium px-6 py-3 rounded-xl transition-all duration-200"
                        >
                            Вернуться на главную
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {profiles.map((profile: any) => (
                            <ProfileCard key={profile.id} profile={profile} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
