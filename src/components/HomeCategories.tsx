'use client';

import Link from 'next/link';
import { CATEGORIES, SUB_CATEGORIES } from '@/constants/categories';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { ChevronDown } from 'lucide-react';

const CATEGORY_STYLES = {
    cleaning: 'bg-blue-50 text-blue-600',
    repair: 'bg-orange-50 text-orange-600',
    beauty: 'bg-pink-50 text-pink-600',
    cargo: 'bg-green-50 text-green-600',
    auto: 'bg-cyan-50 text-cyan-600',
    plumbing: 'bg-indigo-50 text-indigo-600',
    all: 'bg-gray-50 text-gray-600'
};

export function HomeCategories() {
    // Only these categories are shown on home page based on previous hardcoded list
    const HOME_CATS = ['cleaning', 'repair', 'beauty', 'cargo', 'auto', 'all'];

    return (
        <section className="container mx-auto px-4 py-12">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {HOME_CATS.map((catId, idx) => {
                    const cat = CATEGORIES.find(c => c.id === catId) || { id: 'all', name: 'Все', icon: '🔍' };
                    const colorClass = CATEGORY_STYLES[catId as keyof typeof CATEGORY_STYLES] || 'bg-gray-50 text-gray-600';
                    const hasSub = SUB_CATEGORIES[catId] && SUB_CATEGORIES[catId].length > 0;

                    if (catId === 'all') {
                        return (
                            <Link
                                key={cat.id}
                                href="/search"
                                className="group bg-white p-6 rounded-2xl shadow-lg shadow-gray-200/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col items-center justify-center gap-3 border border-gray-100"
                            >
                                <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl ${colorClass} group-hover:scale-110 transition-transform duration-300`}>
                                    {cat.icon}
                                </div>
                                <span className="font-bold text-gray-800 group-hover:text-black transition-colors">{cat.name}</span>
                            </Link>
                        );
                    }

                    return (
                        <HoverCard key={cat.id} openDelay={200} closeDelay={100}>
                            <HoverCardTrigger asChild>
                                <Link
                                    href={`/search?category=${cat.id}`}
                                    className="group bg-white p-6 rounded-2xl shadow-lg shadow-gray-200/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col items-center justify-center gap-3 border border-gray-100 w-full outline-none block text-center"
                                >
                                    <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl ${colorClass} group-hover:scale-110 transition-transform duration-300 mx-auto`}>
                                        {cat.icon}
                                    </div>
                                    <span className="font-bold text-gray-800 group-hover:text-black transition-colors flex items-center justify-center gap-1">
                                        {cat.name}
                                        {hasSub && <ChevronDown className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />}
                                    </span>
                                </Link>
                            </HoverCardTrigger>
                            <HoverCardContent className="w-64 p-2 rounded-xl shadow-xl border-gray-100" align="center" sideOffset={8}>
                                <div className="grid gap-1">
                                    <div className="px-2 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                        {cat.name}
                                    </div>
                                    {SUB_CATEGORIES[cat.id]?.map((sub) => (
                                        <Link
                                            key={sub}
                                            href={`/search?category=${cat.id}&subcategory=${encodeURIComponent(sub)}`}
                                            className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-black rounded-lg transition-colors text-left"
                                        >
                                            {sub}
                                        </Link>
                                    ))}
                                    <div className="h-px bg-gray-100 my-1" />
                                    <Link
                                        href={`/search?category=${cat.id}`}
                                        className="block px-3 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-left"
                                    >
                                        Смотреть все
                                    </Link>
                                </div>
                            </HoverCardContent>
                        </HoverCard>
                    );
                })}
            </div>
        </section>
    );
}
