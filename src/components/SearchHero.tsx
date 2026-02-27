'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, MapPin, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LocationAutocomplete } from './LocationAutocomplete';
import { SUB_CATEGORIES } from '@/constants/categories';

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
    parentId?: string; // Only for subcategories
    parentSlug?: string; // Only for subcategories
    parentName?: string; // Only for subcategories
}

interface SearchHeroProps {
    categories?: Category[];
    user?: {
        name?: string | null;
        image?: string | null;
    } | null;
}

export function SearchHero({ categories = [], user }: SearchHeroProps) {
    const router = useRouter();
    const [serviceQuery, setServiceQuery] = useState('');
    const [locationQuery, setLocationQuery] = useState('');
    const [radius, setRadius] = useState(10);
    const [coordinates, setCoordinates] = useState<{ lat: number | null; lng: number | null }>({ lat: null, lng: null });

    // Dropdown state
    const [isServiceFocused, setIsServiceFocused] = useState(false);
    const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const locationInputRef = useRef<HTMLInputElement>(null);

    // Track explicitly selected parameters
    const [selectedParams, setSelectedParams] = useState<{ category?: string; subcategory?: string } | null>(null);

    // Flatten all searchable items (Categories + Subcategories)
    const allSearchItems = useMemo(() => {
        const items: SearchItem[] = [];

        // Add main categories
        categories.forEach(cat => {
            items.push({
                id: cat.id,
                name: cat.name,
                slug: cat.slug,
                type: 'CATEGORY'
            });

            // Add subcategories for this category if they exist
            // Keys in SUB_CATEGORIES are slugs (e.g., 'cleaning', 'beauty')
            // So we use cat.slug to look them up
            const subs = SUB_CATEGORIES[cat.slug];
            if (subs) {
                subs.forEach(subName => {
                    items.push({
                        id: `${cat.slug}-${subName}`, // unique key using slug
                        name: subName,
                        slug: subName, // subcategory "slug" is just name primarily or url encoded
                        type: 'SUBCATEGORY',
                        parentId: cat.id,
                        parentSlug: cat.slug,
                        parentName: cat.name
                    });
                });
            }
        });

        return items;
    }, [categories]);

    const [filteredItems, setFilteredItems] = useState<SearchItem[]>([]);

    // Filter items when user types
    useEffect(() => {
        if (!serviceQuery.trim()) {
            // Show only main categories by default
            setFilteredItems(allSearchItems.filter(item => item.type === 'CATEGORY'));
        } else {
            const lowerQ = serviceQuery.toLowerCase();
            setFilteredItems(
                allSearchItems.filter(item =>
                    item.name.toLowerCase().includes(lowerQ) ||
                    (item.parentName && item.parentName.toLowerCase().includes(lowerQ))
                ).slice(0, 10) // Limit results
            );
        }
    }, [serviceQuery, allSearchItems]);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsServiceFocused(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [wrapperRef]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams();

        // Use explicitly selected params if the query matches the selected item name
        if (selectedParams && serviceQuery === (selectedParams.subcategory || categories.find(c => c.slug === selectedParams.category)?.name)) {
            if (selectedParams.category) params.set('category', selectedParams.category);
            if (selectedParams.subcategory) params.set('subcategory', selectedParams.subcategory);
        } else if (selectedParams) {
            // Fallback: If user selected something but then edited the text slightly?
            // Or if serviceQuery matches the name we set.
            // Let's trust selectedParams heavily if serviceQuery contains it
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

        // Focus location input instead of routing immediately
        setTimeout(() => {
            locationInputRef.current?.focus();
        }, 0);
    };

    return (
        <section className="relative min-h-[calc(100vh-5rem)] flex items-start justify-center pt-16 md:pt-72">
            {/* Background Image with Overlay */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900" />
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1600607686527-6fb886090705?q=80&w=2700&auto=format&fit=crop')] bg-cover bg-center opacity-40 mix-blend-overlay" />
                <div className="absolute inset-0 bg-black/30" />
            </div>

            <div className="container mx-auto px-4 relative z-10 w-full max-w-5xl text-center">

                <div className="flex flex-col items-center mb-8 animate-slide-up">
                    <div className="relative w-40 h-40 mb-2">
                        <img src="/logo-icon.png?v=6" alt="Svoi.de" className="w-full h-full object-contain" />
                    </div>
                    <div className="text-center">
                        <span className="block text-6xl font-bold text-white tracking-tight leading-none mb-1">svoi.de</span>
                        <span className="block text-xl text-white/90 font-light">Свои люди - свой сервис</span>
                    </div>
                </div>



                {/* Main Search Bar Container */}
                <form
                    onSubmit={handleSearch}
                    className={cn(
                        "bg-white rounded-xl p-2 shadow-2xl flex flex-col md:flex-row items-center gap-2 md:gap-0 animate-slide-up relative",
                    )}
                    style={{ animationDelay: '0.2s' }}
                >
                    {/* Service Input Section */}
                    <div ref={wrapperRef} className="relative flex-1 w-full md:border-r border-gray-100">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs uppercase tracking-wider pointer-events-none">
                            Что
                        </div>
                        <Input
                            value={serviceQuery}
                            onChange={(e) => setServiceQuery(e.target.value)}
                            onFocus={() => setIsServiceFocused(true)}
                            className="w-full h-14 pl-16 pt-1 pb-1 border-none bg-transparent shadow-none focus-visible:ring-0 text-base font-semibold placeholder:font-normal placeholder:text-gray-300 rounded-lg md:rounded-r-none"
                            placeholder="Название услуги, салона..."
                        />

                        {/* Dropdown Menu */}
                        {isServiceFocused && (
                            <div className="absolute top-full left-0 w-full md:min-w-[500px] mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 text-left animate-fade-in">

                                {/* CASE 1: Default View (Cascading Menu) */}
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
                                                        type: 'CATEGORY'
                                                    })}
                                                    className={cn(
                                                        "px-4 py-3 cursor-pointer transition-colors flex items-center justify-between text-sm font-medium",
                                                        hoveredCategory === cat.slug
                                                            ? "bg-white text-blue-600 shadow-sm"
                                                            : "text-gray-700 hover:bg-gray-100"
                                                    )}
                                                >
                                                    {cat.name}
                                                    <ChevronRight className={cn("w-4 h-4", hoveredCategory === cat.slug ? "text-blue-500" : "text-gray-300")} />
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
                                                                        slug: sub, // subcategory slug assumed same as name or simple
                                                                        type: 'SUBCATEGORY',
                                                                        parentId: parentCat.id,
                                                                        parentSlug: parentCat.slug
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
                                    /* CASE 2: Search Results (Flat List) */
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
                        {/* 
                            Location Autocomplete (OSM)
                        */}
                        <LocationAutocomplete
                            focusRef={locationInputRef}
                            defaultValue={locationQuery}
                            onSelect={(addr, lat, lng) => {
                                setLocationQuery(addr);
                                setCoordinates({ lat, lng });
                            }}
                            className="w-full h-14 pl-16 pt-1 pb-1 border-none bg-transparent shadow-none focus-visible:ring-0 text-base font-semibold placeholder:font-normal placeholder:text-gray-300 rounded-lg md:rounded-l-none"
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
        </section>
    );
}
