'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';
import { SUB_CATEGORIES } from '@/constants/categories';
import toast from 'react-hot-toast';

const LocationAutocomplete = dynamic(
    () => import('@/components/LocationAutocomplete').then(mod => mod.LocationAutocomplete),
    { ssr: false, loading: () => <div className="h-14 w-full bg-booking-card animate-pulse rounded-lg md:rounded-l-none" /> },
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
        <div className="w-full max-w-4xl mx-auto px-4 md:px-8 py-6">
            <form
                onSubmit={handleSearch}
                className="bg-white rounded-xl p-2 shadow-2xl flex flex-col md:flex-row items-center gap-2 md:gap-0 relative"
            >
                {/* Service Input */}
                <div ref={wrapperRef} className="relative flex-1 w-full md:border-r border-gray-100">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs uppercase tracking-wider pointer-events-none">
                        Что
                    </div>
                    <Input
                        value={serviceQuery}
                        onChange={(e) => { setServiceQuery(e.target.value); if (validationError.service) setValidationError(prev => ({ ...prev, service: false })); }}
                        onFocus={() => setIsServiceFocused(true)}
                        className={cn(
                            'w-full h-14 pl-16 pt-1 pb-1 border-none bg-transparent shadow-none focus-visible:ring-0 text-base font-semibold placeholder:font-normal placeholder:text-gray-300 rounded-lg md:rounded-r-none transition-all duration-300',
                            validationError.service && 'ring-2 ring-red-400 bg-red-50/50',
                        )}
                        placeholder="Название услуги, салона..."
                    />

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
                                                        ? 'bg-white text-blue-600 shadow-sm'
                                                        : 'text-gray-700 hover:bg-gray-100',
                                                )}
                                            >
                                                {cat.name}
                                                <ChevronRight className={cn('w-4 h-4', hoveredCategory === cat.slug ? 'text-blue-500' : 'text-gray-300')} />
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
                                                        className="px-3 py-2 cursor-pointer hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors text-sm text-gray-600 mb-1"
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
                                                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
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
                <div className="relative flex-1 w-full">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs uppercase tracking-wider pointer-events-none z-10">
                        Где
                    </div>
                    <LocationAutocomplete
                        focusRef={locationInputRef}
                        defaultValue={locationQuery}
                        onSelect={(addr, lat, lng) => {
                            setLocationQuery(addr);
                            setCoordinates({ lat, lng });
                            if (validationError.location) setValidationError(prev => ({ ...prev, location: false }));
                        }}
                        className={cn(
                            'w-full h-14 pl-16 pt-1 pb-1 border-none bg-transparent shadow-none focus-visible:ring-0 text-base font-semibold placeholder:font-normal placeholder:text-gray-300 rounded-lg md:rounded-l-none transition-all duration-300',
                            validationError.location && 'ring-2 ring-red-400 bg-red-50/50',
                        )}
                    />
                </div>

                {/* Search Button */}
                <Button
                    type="submit"
                    className="w-full md:w-auto h-12 md:h-12 px-8 bg-black hover:bg-gray-800 text-white font-bold rounded-lg transition-all"
                >
                    Найти
                </Button>
            </form>
        </div>
    );
}
