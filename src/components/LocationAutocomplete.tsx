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
}

export function LocationAutocomplete({ onSelect, defaultValue = '', className, focusRef }: LocationAutocompleteProps) {
    const [value, setValue] = useState(defaultValue);
    const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const debouncedValue = useDebounce(value, 300);

    // Major cities manual boost (to fix Nominatim ranking issues for short prefixes)
    // Generated via script for top ~20 German cities
    const MAJOR_CITIES: { names: string[], triggers: string[], data: NominatimResult }[] = [
        {
            names: ["berlin", "berlin", "берлин"],
            triggers: ["b", "б", "be", "бе"],
            data: {
                place_id: 134131805, osm_id: 62422, osm_type: "relation", lat: "52.5173885", lon: "13.3951309",
                display_name: "Берлин, Германия", class: "boundary", type: "administrative", importance: 0.8522196536088086,
                licence: "Data © OpenStreetMap contributors, ODbL 1.0. http://osm.org/copyright", boundingbox: []
            } as unknown as NominatimResult
        },
        {
            names: ["hamburg", "hamburg", "гамбург"],
            triggers: ["h", "г", "ha", "га"],
            data: {
                place_id: 129789555, osm_id: 62782, osm_type: "relation", lat: "53.5503410", lon: "10.0006540",
                display_name: "Гамбург, Германия", class: "boundary", type: "administrative", importance: 0.7877290162608149,
                licence: "Data © OpenStreetMap contributors, ODbL 1.0. http://osm.org/copyright", boundingbox: []
            } as unknown as NominatimResult
        },
        {
            names: ["münchen", "munchen", "мюнхен"],
            triggers: ["m", "м", "mü", "мю", "mu"],
            data: {
                place_id: 117581410, osm_id: 62428, osm_type: "relation", lat: "48.1371079", lon: "11.5753822",
                display_name: "Мюнхен, Бавария, Германия", class: "boundary", type: "administrative", importance: 0.8105981661589455,
                licence: "Data © OpenStreetMap contributors, ODbL 1.0. http://osm.org/copyright", boundingbox: []
            } as unknown as NominatimResult
        },
        {
            names: ["köln", "koln", "кёльн"],
            triggers: ["k", "к", "kö", "кё", "ko"],
            data: {
                place_id: 106066015, osm_id: 62578, osm_type: "relation", lat: "50.9383610", lon: "6.9599740",
                display_name: "Кёльн, Северный Рейн — Вестфалия, Германия", class: "boundary", type: "administrative", importance: 0.7583028574734825,
                licence: "Data © OpenStreetMap contributors, ODbL 1.0. http://osm.org/copyright", boundingbox: []
            } as unknown as NominatimResult
        },
        {
            names: ["frankfurt am main", "frankfurt am main", "франкфурт-на-майне"],
            triggers: ["f", "ф", "fr", "фр"],
            data: {
                place_id: 127334826, osm_id: 62400, osm_type: "relation", lat: "50.1106444", lon: "8.6820917",
                display_name: "Франкфурт-на-Майне, Гессен, Германия", class: "boundary", type: "administrative", importance: 0.7473970382925892,
                licence: "Data © OpenStreetMap contributors, ODbL 1.0. http://osm.org/copyright", boundingbox: []
            } as unknown as NominatimResult
        },
        {
            names: ["stuttgart", "stuttgart", "штутгарт"],
            triggers: ["s", "ш", "st", "шт"],
            data: {
                place_id: 112463238, osm_id: 2793104, osm_type: "relation", lat: "48.7784485", lon: "9.1800132",
                display_name: "Штутгарт, Баден-Вюртемберг, Германия", class: "boundary", type: "administrative", importance: 0.7482923125603024,
                licence: "Data © OpenStreetMap contributors, ODbL 1.0. http://osm.org/copyright", boundingbox: []
            } as unknown as NominatimResult
        },
        {
            names: ["düsseldorf", "dusseldorf", "дюссельдорф"],
            triggers: ["d", "д", "dü", "дю", "du"],
            data: {
                place_id: 102124007, osm_id: 62539, osm_type: "relation", lat: "51.2254018", lon: "6.7763137",
                display_name: "Дюссельдорф, Северный Рейн — Вестфалия, Германия", class: "boundary", type: "administrative", importance: 0.7310605525031979,
                licence: "Data © OpenStreetMap contributors, ODbL 1.0. http://osm.org/copyright", boundingbox: []
            } as unknown as NominatimResult
        },
        {
            names: ["dortmund", "dortmund", "дортмунд"],
            triggers: ["d", "д", "do", "до"],
            data: {
                place_id: 103955318, osm_id: 1829065, osm_type: "relation", lat: "51.5142273", lon: "7.4652789",
                display_name: "Дортмунд, Северный Рейн — Вестфалия, Германия", class: "boundary", type: "administrative", importance: 0.6915985025910664,
                licence: "Data © OpenStreetMap contributors, ODbL 1.0. http://osm.org/copyright", boundingbox: []
            } as unknown as NominatimResult
        },
        {
            names: ["essen", "essen", "эссен"],
            triggers: ["e", "э", "es", "эс"],
            data: {
                place_id: 129798031, osm_id: 62713, osm_type: "relation", lat: "51.4582235", lon: "7.0158171",
                display_name: "Эссен, Северный Рейн — Вестфалия, Германия", class: "boundary", type: "administrative", importance: 0.7490212042129525,
                licence: "Data © OpenStreetMap contributors, ODbL 1.0. http://osm.org/copyright", boundingbox: []
            } as unknown as NominatimResult
        },
        {
            names: ["leipzig", "leipzig", "лейпциг"],
            triggers: ["l", "л", "le", "ле"],
            data: {
                place_id: 130193233, osm_id: 62649, osm_type: "relation", lat: "51.3406321", lon: "12.3747329",
                display_name: "Лейпциг, Саксония, Германия", class: "boundary", type: "administrative", importance: 0.7139199216773322,
                licence: "Data © OpenStreetMap contributors, ODbL 1.0. http://osm.org/copyright", boundingbox: []
            } as unknown as NominatimResult
        },
        {
            names: ["bremen", "bremen", "бремен"],
            triggers: ["b", "б", "br", "бр"],
            data: {
                place_id: 133221971, osm_id: 62718, osm_type: "relation", lat: "53.0758196", lon: "8.8071646",
                display_name: "Бремен, Германия", class: "boundary", type: "administrative", importance: 0.7127197721039941,
                licence: "Data © OpenStreetMap contributors, ODbL 1.0. http://osm.org/copyright", boundingbox: []
            } as unknown as NominatimResult
        },
        {
            names: ["dresden", "dresden", "дрезден"],
            triggers: ["d", "д", "dr", "др"],
            data: {
                place_id: 104278453, osm_id: 191645, osm_type: "relation", lat: "51.0493286", lon: "13.7383200",
                display_name: "Дрезден, Саксония, Германия", class: "boundary", type: "administrative", importance: 0.70994508906933,
                licence: "Data © OpenStreetMap contributors, ODbL 1.0. http://osm.org/copyright", boundingbox: []
            } as unknown as NominatimResult
        },
        {
            names: ["hannover", "hannover", "ганновер"],
            triggers: ["h", "г", "ha", "га"],
            data: {
                place_id: 133469904, osm_id: 62723, osm_type: "relation", lat: "52.3744779", lon: "9.7385532",
                display_name: "Ганновер, Нижняя Саксония, Германия", class: "boundary", type: "administrative", importance: 0.7389148464627151,
                licence: "Data © OpenStreetMap contributors, ODbL 1.0. http://osm.org/copyright", boundingbox: []
            } as unknown as NominatimResult
        },
        {
            names: ["nürnberg", "nurnberg", "нюрнберг"],
            triggers: ["n", "н", "nü", "ню", "nu"],
            data: {
                place_id: 134105139, osm_id: 62780, osm_type: "relation", lat: "49.4538720", lon: "11.0772980",
                display_name: "Нюрнберг, Бавария, Германия", class: "boundary", type: "administrative", importance: 0.7303362157774903,
                licence: "Data © OpenStreetMap contributors, ODbL 1.0. http://osm.org/copyright", boundingbox: []
            } as unknown as NominatimResult
        }
    ];

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
                <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 text-left animate-fade-in max-h-80 overflow-y-auto">

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
