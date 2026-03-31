'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';
import { SUB_CATEGORIES } from '@/constants/categories';
import toast from 'react-hot-toast';
import { ChevronRight } from 'lucide-react';

const LocationAutocomplete = dynamic(
    () => import('@/components/LocationAutocomplete').then(mod => mod.LocationAutocomplete),
    { ssr: false, loading: () => <div className="h-14 w-full animate-pulse rounded-lg bg-white/5" /> },
);

interface Category {
    id: string;
    name: string;
    slug: string;
    image: string | null;
}

interface SearchItem {
    id: string;
    name: string;
    slug: string;
    type: 'CATEGORY' | 'SUBCATEGORY';
    parentId?: string;
    parentSlug?: string;
    parentName?: string;
}

interface SearchBarProps {
    categories?: Category[];
}

export default function SearchBar({ categories = [] }: SearchBarProps) {
    const router = useRouter();
    const [serviceQuery, setServiceQuery] = useState('');
    const [locationQuery, setLocationQuery] = useState('');
    const [radius, setRadius] = useState(10);
    const [coordinates, setCoordinates] = useState<{ lat: number | null; lng: number | null }>({ lat: null, lng: null });
    const [validationError, setValidationError] = useState<{ service: boolean; location: boolean }>({ service: false, location: false });

    const [isServiceFocused, setIsServiceFocused] = useState(false);
    const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const locationInputRef = useRef<HTMLInputElement>(null);

    const [selectedParams, setSelectedParams] = useState<{ category?: string; subcategory?: string } | null>(null);

    const allSearchItems = useMemo(() => {
        const items: SearchItem[] = [];

        categories.forEach(cat => {
            items.push({
                id: cat.id,
                name: cat.name,
                slug: cat.slug,
                type: 'CATEGORY',
            });

            const subs = SUB_CATEGORIES[cat.slug];
            if (subs) {
                subs.forEach(subName => {
                    items.push({
                        id: `${cat.slug}-${subName}`,
                        name: subName,
                        slug: subName,
                        type: 'SUBCATEGORY',
                        parentId: cat.id,
                        parentSlug: cat.slug,
                        parentName: cat.name,
                    });
                });
            }
        });

        return items;
    }, [categories]);

    const [filteredItems, setFilteredItems] = useState<SearchItem[]>([]);

    useEffect(() => {
        if (!serviceQuery.trim()) {
            setFilteredItems(allSearchItems.filter(item => item.type === 'CATEGORY'));
        } else {
            const lowerQ = serviceQuery.toLowerCase();
            setFilteredItems(
                allSearchItems.filter(item =>
                    item.name.toLowerCase().includes(lowerQ) ||
                    (item.parentName && item.parentName.toLowerCase().includes(lowerQ)),
                ).slice(0, 10),
            );
        }
    }, [serviceQuery, allSearchItems]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsServiceFocused(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [wrapperRef]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();

        const hasService = serviceQuery.trim().length > 0;
        const hasLocation = locationQuery.trim().length > 0;

        if (!hasService || !hasLocation) {
            setValidationError({ service: !hasService, location: !hasLocation });
            toast.error('Пожалуйста, укажите город и желаемую услугу для точного поиска');
            setTimeout(() => setValidationError({ service: false, location: false }), 3000);
            return;
        }

        setValidationError({ service: false, location: false });
        const params = new URLSearchParams();

        if (selectedParams) {
            if (selectedParams.category) params.set('category', selectedParams.category);
            if (selectedParams.subcategory) params.set('subcategory', selectedParams.subcategory);
        }

        if (serviceQuery.trim()) params.set('q', serviceQuery.trim());
        if (locationQuery.trim()) params.set('location', locationQuery.trim());
        if (coordinates.lat && coordinates.lng) {
            params.set('lat', coordinates.lat.toString());
            params.set('lng', coordinates.lng.toString());
            params.set('radius', radius.toString());
        }

        router.push(`/search?${params.toString()}`);
    };

    const handleSelectItem = (item: SearchItem) => {
        setServiceQuery(item.name);
        setIsServiceFocused(false);

        if (item.type === 'CATEGORY') {
            setSelectedParams({ category: item.slug });
        } else if (item.type === 'SUBCATEGORY' && item.parentSlug) {
            setSelectedParams({ category: item.parentSlug, subcategory: item.name });
        }

        setTimeout(() => {
            locationInputRef.current?.focus();
        }, 0);
    };

    return (
        <div className="w-full max-w-4xl mx-auto mb-8">
            <form
                onSubmit={handleSearch}
                className="bg-white/10 backdrop-blur-xl p-2 rounded-xl border border-white/10 shadow-2xl flex flex-col md:flex-row items-stretch gap-2"
            >
                {/* Service Input */}
                <div ref={wrapperRef} className="relative flex-1">
                    <div className="flex items-center px-4 bg-white/5 rounded-lg border border-transparent focus-within:border-booking-primary transition-all">
                        <svg className="w-5 h-5 text-white/50 mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.121 14.121A3 3 0 1 0 9.879 9.879a3 3 0 0 0 4.242 4.242zm0 0L21 21" />
                        </svg>
                        <input
                            value={serviceQuery}
                            onChange={(e) => { setServiceQuery(e.target.value); if (validationError.service) setValidationError(prev => ({ ...prev, service: false })); }}
                            onFocus={() => setIsServiceFocused(true)}
                            className={cn(
                                'w-full bg-transparent border-none focus:ring-0 focus:outline-none text-white placeholder-white/40 py-4 text-base',
                                validationError.service && 'text-red-300 placeholder-red-300/50',
                            )}
                            placeholder="Название услуги"
                        />
                    </div>

                    {/* Dropdown Menu */}
                    {isServiceFocused && (
                        <div className="absolute top-full left-0 w-full md:min-w-[500px] mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 text-left animate-fade-in">
                            {!serviceQuery.trim() ? (
                                <div className="flex max-h-[50vh] md:max-h-[400px]">
                                    {/* Left Col: Categories */}
                                    <div className="w-1/2 overflow-y-auto border-r border-gray-100 bg-gray-50/50">
                                        {categories.map((cat) => (
                                            <div
                                                key={cat.id}
                                                onMouseEnter={() => setHoveredCategory(cat.slug)}
                                                onClick={() => handleSelectItem({
                                                    id: cat.id,
                                                    name: cat.name,
                                                    slug: cat.slug,
                                                    type: 'CATEGORY',
                                                })}
                                                className={cn(
                                                    'px-4 py-3 cursor-pointer transition-colors flex items-center justify-between text-sm font-medium',
                                                    hoveredCategory === cat.slug
                                                        ? 'bg-white text-booking-primary shadow-sm'
                                                        : 'text-gray-700 hover:bg-gray-100',
                                                )}
                                            >
                                                {cat.name}
                                                <ChevronRight className={cn('w-4 h-4', hoveredCategory === cat.slug ? 'text-booking-primary' : 'text-gray-300')} />
                                            </div>
                                        ))}
                                    </div>

                                    {/* Right Col: Subcategories */}
                                    <div className="w-1/2 overflow-y-auto bg-white p-2">
                                        {hoveredCategory && SUB_CATEGORIES[hoveredCategory] ? (
                                            <>
                                                <div className="px-3 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                                                    {categories.find(c => c.slug === hoveredCategory)?.name}
                                                </div>
                                                {SUB_CATEGORIES[hoveredCategory].map((sub) => (
                                                    <div
                                                        key={sub}
                                                        onClick={() => {
                                                            const parentCat = categories.find(c => c.slug === hoveredCategory);
                                                            if (parentCat) {
                                                                handleSelectItem({
                                                                    id: `${parentCat.id}-${sub}`,
                                                                    name: sub,
                                                                    slug: sub,
                                                                    type: 'SUBCATEGORY',
                                                                    parentId: parentCat.id,
                                                                    parentSlug: parentCat.slug,
                                                                });
                                                            }
                                                        }}
                                                        className="px-3 py-2 cursor-pointer hover:bg-green-50 hover:text-booking-primary rounded-lg transition-colors text-sm text-gray-600 mb-1"
                                                    >
                                                        {sub}
                                                    </div>
                                                ))}
                                            </>
                                        ) : (
                                            <div className="h-full flex items-center justify-center text-gray-400 text-sm p-4 text-center">
                                                Выберите категорию, чтобы увидеть услуги
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="max-h-[50vh] md:max-h-80 overflow-y-auto">
                                    {filteredItems.length > 0 ? (
                                        filteredItems.map((item) => (
                                            <div
                                                key={item.id}
                                                onClick={() => handleSelectItem(item)}
                                                className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors flex items-center justify-between group border-b border-gray-50 last:border-0"
                                            >
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-gray-700 group-hover:text-black text-sm">
                                                        {item.name}
                                                    </span>
                                                    {item.type === 'SUBCATEGORY' && (
                                                        <span className="text-xs text-gray-400">
                                                            в категории {item.parentName}
                                                        </span>
                                                    )}
                                                </div>
                                                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-booking-primary transition-colors" />
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-4 text-center text-gray-500 text-sm">
                                            Услуги не найдены
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Location Input */}
                <div className="relative flex-1">
                    <div className="flex items-center px-4 bg-white/5 rounded-lg border border-transparent focus-within:border-booking-primary transition-all">
                        <svg className="w-5 h-5 text-white/50 mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                        </svg>
                        <LocationAutocomplete
                            focusRef={locationInputRef}
                            defaultValue={locationQuery}
                            onSelect={(addr, lat, lng) => {
                                setLocationQuery(addr);
                                setCoordinates({ lat, lng });
                                if (validationError.location) setValidationError(prev => ({ ...prev, location: false }));
                            }}
                            className={cn(
                                'w-full bg-transparent border-none focus:ring-0 focus:outline-none text-white placeholder-white/40 py-4 text-base',
                                validationError.location && 'text-red-300 placeholder-red-300/50',
                            )}
                        />
                    </div>
                </div>

                {/* Search Button */}
                <button
                    type="submit"
                    className="bg-booking-primary text-white px-10 py-4 rounded-lg font-bold uppercase tracking-widest text-xs hover:brightness-110 active:scale-95 transition-all"
                >
                    Поиск
                </button>
            </form>
        </div>
    );
}
