'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';
import { SUB_CATEGORIES } from '@/constants/categories';
import toast from 'react-hot-toast';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

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

    const PREMIUM_SERVICES = [
        { id: 'hair', title: 'ВОЛОСЫ', items: ['Окрашивание', 'Стрижка', 'Укладка'] },
        { id: 'nails', title: 'НОГТИ', items: ['Маникюр', 'Педикюр', 'Наращивание'] },
        { id: 'face', title: 'ЛИЦО', items: ['Брови', 'Ресницы', 'Уход за кожей'] },
        { id: 'body', title: 'ТЕЛО И ОБРАЗ', items: ['Макияж', 'Массаж', 'Депиляция'] }
    ];

    const filteredMegaMenu = useMemo(() => {
        if (!serviceQuery.trim()) return PREMIUM_SERVICES;
        const q = serviceQuery.toLowerCase();
        
        return PREMIUM_SERVICES.map(cat => {
            const matchesCat = cat.title.toLowerCase().includes(q);
            const matchingItems = cat.items.filter(item => item.toLowerCase().includes(q));
            
            if (matchesCat) return { ...cat };
            if (matchingItems.length > 0) return { ...cat, items: matchingItems };
            return null;
        }).filter(Boolean) as typeof PREMIUM_SERVICES;
    }, [serviceQuery]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsServiceFocused(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [wrapperRef]);

    useEffect(() => {
        const handleSmartTrigger = ((e: CustomEvent<{ service: string }>) => {
            setServiceQuery(e.detail.service);
            
            if (locationInputRef.current) {
                locationInputRef.current.focus();
                const parent = locationInputRef.current.closest('div.flex.items-center');
                if (parent) {
                    parent.classList.add('ring-2', 'ring-booking-primary', 'ring-offset-2', 'ring-offset-[#2f4b3a]', 'animate-pulse');
                    setTimeout(() => {
                        parent.classList.remove('ring-2', 'ring-booking-primary', 'ring-offset-2', 'ring-offset-[#2f4b3a]', 'animate-pulse');
                    }, 2000);
                }
            }
        }) as EventListener;

        window.addEventListener('smart-search-trigger', handleSmartTrigger);
        return () => window.removeEventListener('smart-search-trigger', handleSmartTrigger);
    }, []);

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

        if (serviceQuery.trim()) params.set('q', serviceQuery.trim());
        if (locationQuery.trim()) params.set('location', locationQuery.trim());
        if (coordinates.lat && coordinates.lng) {
            params.set('lat', coordinates.lat.toString());
            params.set('lng', coordinates.lng.toString());
            params.set('radius', radius.toString());
        }

        router.push(`/search?${params.toString()}`);
    };

    const handleSelectMegaMenuItem = (serviceName: string) => {
        setServiceQuery(serviceName);
        setIsServiceFocused(false);
        setTimeout(() => locationInputRef.current?.focus(), 0);
    };

    return (
        <div className="w-full max-w-4xl mx-auto mb-8 relative" ref={wrapperRef}>
            <form
                onSubmit={handleSearch}
                className="bg-white/10 backdrop-blur-xl p-2 rounded-xl border border-white/10 shadow-2xl flex flex-col md:flex-row items-stretch gap-2"
            >
                {/* Service Input */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center px-4 bg-white/5 rounded-lg border border-transparent focus-within:border-booking-primary transition-all h-[56px]">
                        <svg className="w-5 h-5 text-white/50 mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.121 14.121A3 3 0 1 0 9.879 9.879a3 3 0 0 0 4.242 4.242zm0 0L21 21" />
                        </svg>
                        <input
                            value={serviceQuery}
                            onChange={(e) => { setServiceQuery(e.target.value); if (validationError.service) setValidationError(prev => ({ ...prev, service: false })); }}
                            onFocus={() => setIsServiceFocused(true)}
                            className={cn(
                                'w-full h-full bg-transparent border-none focus:ring-0 focus:outline-none text-white placeholder-white/40 text-[16px] md:text-base',
                                validationError.service && 'text-red-300 placeholder-red-300/50',
                            )}
                            placeholder="Название услуги"
                        />
                    </div>
                </div>

                {/* Location Input */}
                <div className="flex-1 min-w-0">
                    <div
                        className="flex items-center px-4 bg-white/5 rounded-lg border border-transparent focus-within:border-booking-primary focus-within:ring-1 focus-within:ring-[#1B2A23] transition-all duration-200 h-[56px] cursor-text"
                        onMouseDown={(e) => {
                            // Focus the input when clicking the padding area of the chrome,
                            // but leave clicks on inner elements (input, geolocation button) alone.
                            if (e.target === e.currentTarget) {
                                e.preventDefault();
                                locationInputRef.current?.focus();
                            }
                        }}
                    >
                        <LocationAutocomplete
                            focusRef={locationInputRef}
                            defaultValue={locationQuery}
                            onFocus={() => setIsServiceFocused(false)}
                            onSelect={(addr, lat, lng) => {
                                setLocationQuery(addr);
                                setCoordinates({ lat, lng });
                                if (validationError.location) setValidationError(prev => ({ ...prev, location: false }));
                            }}
                            className={cn(
                                'w-full h-full bg-transparent border-none focus:ring-0 focus:outline-none text-white placeholder-white/40 text-[16px] md:text-base cursor-text',
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

            {/* Mega Menu Dropdown */}
            {isServiceFocused && (
                <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-white rounded-3xl shadow-2xl overflow-hidden z-50 text-center animate-fade-in p-6 md:p-8 border border-gray-100">
                    {filteredMegaMenu.length === 0 ? (
                        <div className="text-center text-gray-500 text-sm py-4">
                            Услуги не найдены
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-y-4 gap-x-6">
                                {filteredMegaMenu.map((cat) => (
                                    <div key={cat.title}>
                                        <Link href={`/services?category=${cat.id}`} className="block w-full">
                                            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-widest mb-4 border-b border-gray-100 pb-2 flex flex-col items-center cursor-pointer hover:opacity-70 transition-opacity">
                                                {cat.title}
                                            </h3>
                                        </Link>
                                        <ul className="space-y-3">
                                            {cat.items.map((srv) => (
                                                <li
                                                    key={srv}
                                                    onClick={() => handleSelectMegaMenuItem(srv)}
                                                    className="text-[15px] text-gray-500 hover:text-green-800 hover:font-medium cursor-pointer transition-all duration-200"
                                                >
                                                    {srv}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                            
                            {/* Mega Menu Footer Action */}
                            <div className="mt-8 pt-5 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        router.push('/services');
                                    }}
                                    className="text-sm font-medium text-gray-500 hover:text-green-800 transition-colors duration-200"
                                >
                                    Посмотреть все услуги ➔
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
