'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { MapPin, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/use-debounce'; // Assuming we have or will create this, otherwise I'll implement local debounce

// Simple local debounce hook implementation if not exists

interface LocationAutocompleteProps {
    onSelect: (address: string, lat: number | null, lng: number | null) => void;
    defaultValue?: string;
    className?: string;
    focusRef?: React.Ref<HTMLInputElement>;
}

import { GERMAN_CITIES } from '@/constants/germanCities';

interface NominatimResult {
    place_id: number;
    licence: string;
    osm_type: string;
    osm_id: number;
    boundingbox: string[];
    lat: string;
    lon: string;
    display_name: string;
    class: string;
    type: string;
    importance: number;
    icon?: string;
    addresstype?: string;
}

export function LocationAutocomplete({ onSelect, defaultValue = '', className, focusRef }: LocationAutocompleteProps) {
    const [value, setValue] = useState(defaultValue);
    const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const debouncedValue = useDebounce(value, 300);

    // Major cities manual boost (Generated via script for top ~600 German cities > 20k pop)
    const MAJOR_CITIES = GERMAN_CITIES as unknown as { names: string[], triggers: string[], data: NominatimResult }[];

    // Sync default value
    useEffect(() => {
        if (defaultValue) setValue(defaultValue);
    }, [defaultValue]);

    // Fetch suggestions
    useEffect(() => {
        const fetchSuggestions = async () => {
            // Allow 1 char search if it matches major city triggers
            const queryLower = debouncedValue?.toLowerCase() || '';
            const isMajorTrigger = MAJOR_CITIES.some(city => city.triggers.includes(queryLower));

            if (!debouncedValue || (debouncedValue.length < 2 && !isMajorTrigger)) {
                setSuggestions([]);
                return;
            }

            setIsLoading(true);
            try {
                // Nominatim API: https://nominatim.org/release-docs/develop/api/Search/
                const params = new URLSearchParams({
                    q: debouncedValue,
                    format: 'json',
                    addressdetails: '1',
                    limit: '20', // Fetch more to allow for filtering
                    countrycodes: 'de',
                    'accept-language': 'ru'
                });

                const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`);
                if (!response.ok) throw new Error('Network response was not ok');
                let data: NominatimResult[] = await response.json();

                // 1. FILTERING (Keep only cities/towns/major places)
                // Filter out obviously non-city types (streets, buildings, shops)
                data = data.filter(item => {
                    const type = item.type;
                    const resultClass = item.class;

                    // Always exclude these
                    if (['building', 'amenity', 'shop', 'office', 'highway', 'landuse', 'aeroway', 'tourism', 'railway', 'waterway', 'man_made', 'leisure'].includes(resultClass)) return false;
                    if (['building', 'house', 'yes', 'apartments', 'industrial', 'commercial', 'retail', 'residential', 'tertiary', 'secondary', 'primary', 'track', 'path', 'cycleway', 'footway', 'motel', 'hotel', 'attraction', 'viewpoint', 'museum'].includes(type)) return false;

                    // Strictly allow these (or if class=boundary/place)
                    const isPlace = resultClass === 'boundary' || resultClass === 'place';
                    const isCityLike = ['city', 'town', 'village', 'hamlet', 'administrative', 'municipality'].includes(type);

                    return isPlace && isCityLike;
                });

                // 2. BOOSTING (Inject major cities if missing)
                for (const city of MAJOR_CITIES) {
                    const formattedQuery = queryLower.trim();
                    // Check if query matches a trigger OR is the start of the name
                    const isTrigger = city.triggers.includes(formattedQuery) || city.names.some(n => n.startsWith(formattedQuery));

                    if (isTrigger) {
                        const exists = data.some(d =>
                            d.osm_id === city.data.osm_id ||
                            city.names.some(n => d.display_name.toLowerCase().includes(n))
                        );

                        if (!exists) {
                            data.push(city.data);
                        }
                    }
                }

                // 3. SORTING (By Importance descending)
                // data.sort((a, b) => b.importance - a.importance); // simple numeric sort

                // Refined sort: Boost exact name matches to top, then importance
                data.sort((a, b) => {
                    // Start-of-string match priority
                    const aName = a.display_name.toLowerCase().split(',')[0];
                    const bName = b.display_name.toLowerCase().split(',')[0];
                    const aStarts = aName.startsWith(queryLower);
                    const bStarts = bName.startsWith(queryLower);

                    if (aStarts && !bStarts) return -1;
                    if (!aStarts && bStarts) return 1;

                    return b.importance - a.importance;
                });

                setSuggestions(data.slice(0, 10)); // Limit to top 10 after filter/sort
            } catch (error) {
                console.error("Nominatim search error:", error);

                // Fallback
                const queryLower = debouncedValue?.toLowerCase() || '';
                const fallbackSuggestions: NominatimResult[] = [];
                for (const city of MAJOR_CITIES) {
                    if (city.triggers.includes(queryLower) || city.names.some(n => n.startsWith(queryLower))) {
                        fallbackSuggestions.push(city.data);
                    }
                }
                setSuggestions(fallbackSuggestions);

            } finally {
                setIsLoading(false);
            }
        };

        // Only search if user is actively typing (we can't easily distinguish "typing" vs "setting default", 
        // but checking difference from last selected might work. for now simple debounce.)
        if (isFocused) {
            fetchSuggestions();
        }

    }, [debouncedValue, isFocused]);

    // Click outside handler
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsFocused(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [wrapperRef]);

    const handleSelect = (item: NominatimResult) => {
        const address = item.display_name;
        const lat = parseFloat(item.lat);
        const lng = parseFloat(item.lon);

        setValue(address);
        setSuggestions([]);
        setIsFocused(false);
        onSelect(address, lat, lng);
    };

    const handleGeolocation = () => {
        if (!navigator.geolocation) return;
        setIsLoading(true);

        navigator.geolocation.getCurrentPosition(
            async ({ coords }) => {
                const { latitude, longitude } = coords;
                try {
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`);
                    const data = await response.json();

                    const address = data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
                    setValue(address);
                    onSelect(address, latitude, longitude);
                    setIsFocused(false);
                } catch (error) {
                    console.error("Reverse geocoding failed", error);
                    // Fallback
                    const fallback = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
                    setValue(fallback);
                    onSelect(fallback, latitude, longitude);
                } finally {
                    setIsLoading(false);
                }
            },
            (error) => {
                console.error("Geolocation error:", error);
                setIsLoading(false);
            }
        );
    };

    return (
        <div ref={wrapperRef} className="relative w-full">
            <div className="relative">
                <Input
                    ref={focusRef}
                    value={value}
                    onChange={(e) => {
                        setValue(e.target.value);
                        // Clear selection if user edits text manually
                        // onSelect(e.target.value, null, null); 
                        // Actually, maybe don't clear immediately to avoid flashing, wait for validation or select?
                        // Previous logic: onSelect(e.target.value, null, null);
                        if (e.target.value) onSelect(e.target.value, null, null);
                    }}
                    onFocus={() => setIsFocused(true)}
                    className={cn("pr-10", className)}
                    placeholder="Адрес, город..."
                />

                <button
                    type="button"
                    onClick={handleGeolocation}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
                    title="Мое местоположение"
                >
                    {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <MapPin className="w-5 h-5" />
                    )}
                </button>
            </div>

            {isFocused && (suggestions.length > 0 || isLoading) && (
                <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-[100] text-left animate-fade-in max-h-80 overflow-y-auto">

                    {!isLoading && suggestions.length > 0 && (
                        suggestions.map((item) => (
                            <div
                                key={item.place_id}
                                onClick={() => handleSelect(item)}
                                className="px-4 py-2.5 hover:bg-gray-50 cursor-pointer transition-colors flex items-center gap-3 text-sm text-gray-700"
                            >
                                <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                                <span>{item.display_name}</span>
                            </div>
                        ))
                    )}

                    {!isLoading && value.length > 2 && suggestions.length === 0 && (
                        <div className="p-4 text-center text-xs text-gray-400">
                            Ничего не найдено
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
