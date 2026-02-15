'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

interface SearchBarProps {
    /** Additional classes for the outer wrapper */
    className?: string;
    /** Initial query value (e.g. from URL) */
    defaultQuery?: string;
}

export function SearchBar({ className = '', defaultQuery = '' }: SearchBarProps) {
    const router = useRouter();
    const [query, setQuery] = useState(defaultQuery);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = query.trim();
        if (trimmed) {
            router.push(`/search?q=${encodeURIComponent(trimmed)}`);
        } else {
            router.push('/search');
        }
    };

    return (
        <form onSubmit={handleSubmit} className={className}>
            <div className="bg-white rounded-2xl shadow-2xl p-2 flex items-center gap-2 border border-gray-100">
                <div className="flex-1 flex items-center gap-3 pl-4">
                    <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Найти: Маникюр, Стоматолог, Педиатр..."
                        className="w-full py-3 text-base text-gray-800 placeholder-gray-400 bg-transparent outline-none"
                    />
                </div>
                <button
                    type="submit"
                    className="bg-[#fc0] hover:bg-[#e6b800] text-gray-900 font-semibold px-6 py-3 rounded-xl transition-all duration-200 hover:shadow-lg flex items-center gap-2 flex-shrink-0"
                >
                    <Search className="w-4 h-4" />
                    <span className="hidden sm:inline">Найти</span>
                </button>
            </div>
        </form>
    );
}
