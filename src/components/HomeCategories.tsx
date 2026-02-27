'use client';

import Link from 'next/link';
import { SUB_CATEGORIES } from '@/constants/categories';
import { Sparkles, Scissors, Smile, HandHeart, Eye, Star } from 'lucide-react';

const SUB_CATEGORY_ICONS: Record<string, React.ReactNode> = {
    'Маникюр': <span className="text-2xl">💅</span>,
    'Педикюр': <span className="text-2xl">🦶</span>,
    'Парикмахер': <Scissors className="w-8 h-8" />,
    'Косметолог': <Smile className="w-8 h-8" />,
    'Массаж': <HandHeart className="w-8 h-8" />,
    'Макияж': <span className="text-2xl">💄</span>,
    'Брови': <Eye className="w-8 h-8" />,
    'Ресницы': <Sparkles className="w-8 h-8" />,
    'Эпиляция': <span className="text-2xl">✨</span>,
    'Стилист': <Star className="w-8 h-8" />,
    'Барбер': <span className="text-2xl">💈</span>,
};

const SUB_CATEGORY_COLORS: Record<string, string> = {
    'Маникюр': 'bg-pink-50 text-pink-600',
    'Педикюр': 'bg-rose-50 text-rose-600',
    'Парикмахер': 'bg-violet-50 text-violet-600',
    'Косметолог': 'bg-blue-50 text-blue-600',
    'Массаж': 'bg-emerald-50 text-emerald-600',
    'Макияж': 'bg-fuchsia-50 text-fuchsia-600',
    'Брови': 'bg-amber-50 text-amber-600',
    'Ресницы': 'bg-purple-50 text-purple-600',
    'Эпиляция': 'bg-cyan-50 text-cyan-600',
    'Стилист': 'bg-indigo-50 text-indigo-600',
    'Барбер': 'bg-slate-50 text-slate-800',
};

export function HomeCategories() {
    const beautySubCategories = SUB_CATEGORIES['beauty'] || [];

    return (
        <section className="container mx-auto px-4 py-12">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {beautySubCategories.map((subName) => {
                    const icon = SUB_CATEGORY_ICONS[subName] || <Sparkles className="w-8 h-8" />;
                    const colorClass = SUB_CATEGORY_COLORS[subName] || 'bg-gray-50 text-gray-600';

                    return (
                        <Link
                            key={subName}
                            href={`/search?category=beauty&subcategory=${encodeURIComponent(subName)}`}
                            className="group bg-white p-6 rounded-2xl shadow-lg shadow-gray-200/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col items-center justify-center gap-3 border border-gray-100 w-full outline-none block text-center"
                        >
                            <div className={`w-14 h-14 rounded-full flex items-center justify-center ${colorClass} group-hover:scale-110 transition-transform duration-300 mx-auto`}>
                                {icon}
                            </div>
                            <span className="font-bold text-gray-800 group-hover:text-black transition-colors">
                                {subName}
                            </span>
                        </Link>
                    );
                })}
                <Link
                    href="/search?category=beauty"
                    className="group bg-white p-6 rounded-2xl shadow-lg shadow-gray-200/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col items-center justify-center gap-3 border border-gray-100"
                >
                    <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl bg-gray-50 text-gray-600 group-hover:scale-110 transition-transform duration-300">
                        🔍
                    </div>
                    <span className="font-bold text-gray-800 group-hover:text-black transition-colors">Все услуги</span>
                </Link>
            </div>
        </section>
    );
}
