'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { MapPin, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { resolveGermanCity, getGermanCitySuggestions } from '@/constants/searchSuggestions';
import { GERMAN_CITIES } from '@/constants/germanCities';

interface LocationAutocompleteProps {
    onSelect: (address: string, lat: number | null, lng: number | null) => void;
    defaultValue?: string;
    className?: string;
    focusRef?: React.Ref<HTMLInputElement>;
}

// ─── Haversine distance (km) between two lat/lng points ───
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Find nearest city from our 600-city DB by coordinates ───
function findNearestCity(lat: number, lng: number): { name: string; lat: number; lng: number; distance: number } | null {
    let best: { name: string; lat: number; lng: number; distance: number } | null = null;

    for (const entry of GERMAN_CITIES) {
        if (!entry.data?.lat || !entry.data?.lon) continue;
        const cityLat = parseFloat(entry.data.lat);
        const cityLng = parseFloat(entry.data.lon);
        const dist = haversineKm(lat, lng, cityLat, cityLng);

        if (!best || dist < best.distance) {
            // Get the Russian (Cyrillic) name, fallback to first name
            const names: string[] = Array.isArray(entry.names) ? entry.names : [];
            const cyrillicName = names.find((n: string) => /[а-яё]/i.test(n));
            const displayName = cyrillicName || names[0] || '';
            // Capitalize first letter
            const name = displayName.charAt(0).toUpperCase() + displayName.slice(1);
            best = { name, lat: cityLat, lng: cityLng, distance: dist };
        }
    }

    return best;
}

/** Find lat/lng for a resolved city name from our DB */
function getCoordsForCity(cityName: string): { lat: number; lng: number } | null {
    const normalizedInput = cityName.toLowerCase();
    for (const entry of GERMAN_CITIES) {
        const names: string[] = Array.isArray(entry.names) ? entry.names : [];
        if (names.some((n: string) => n.toLowerCase() === normalizedInput)) {
            if (entry.data?.lat && entry.data?.lon) {
                return { lat: parseFloat(entry.data.lat), lng: parseFloat(entry.data.lon) };
            }
        }
    }
    return null;
}

export function LocationAutocomplete({ onSelect, defaultValue = '', className, focusRef }: LocationAutocompleteProps) {
    const [value, setValue] = useState(defaultValue);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isFocused, setIsFocused] = useState(false);
    const [isLocating, setIsLocating] = useState(false);
    const locatingLockRef = useRef(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (defaultValue) setValue(defaultValue);
    }, [defaultValue]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsFocused(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const updateSuggestions = useCallback((query: string) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setSuggestions(getGermanCitySuggestions(query, 8));
        }, 150);
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setValue(newValue);
        updateSuggestions(newValue);
        if (newValue) onSelect(newValue, null, null);
    };

    const handleSelect = (cityName: string) => {
        setValue(cityName);
        setSuggestions([]);
        setIsFocused(false);

        const coords = getCoordsForCity(cityName);
        if (coords) {
            onSelect(cityName, coords.lat, coords.lng);
        } else {
            const resolved = resolveGermanCity(cityName);
            if (resolved) {
                const resolvedCoords = getCoordsForCity(resolved);
                setValue(resolved);
                onSelect(resolved, resolvedCoords?.lat ?? null, resolvedCoords?.lng ?? null);
            } else {
                onSelect(cityName, null, null);
            }
        }
    };

    /** Reverse geocode coords via OSM Nominatim */
    const getCityFromCoords = async (lat: number, lng: number): Promise<string | null> => {
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=de`,
                { headers: { 'User-Agent': 'SvoiDE/1.0' }, signal: AbortSignal.timeout(5000) }
            );
            if (res.ok) {
                const data = await res.json();
                if (data?.address) {
                    return data.address.city || data.address.town || data.address.village || data.address.municipality || null;
                }
            }
            return null;
        } catch {
            return null;
        }
    };

    const handleGeolocation = async () => {
        if (locatingLockRef.current) return;
        locatingLockRef.current = true;

        toast.dismiss();
        setIsFocused(false);
        setIsLocating(true);

        try {
            let lat: number | null = null;
            let lng: number | null = null;

            // ── Step 1: Try browser GPS ──
            if (navigator.geolocation) {
                try {
                    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject, {
                            enableHighAccuracy: true,
                            timeout: 10000,
                            maximumAge: 60000,
                        });
                    });
                    lat = position.coords.latitude;
                    lng = position.coords.longitude;
                } catch { /* GPS unavailable */ }
            }

            // ── Step 2: If no GPS, get coords from IP services ──
            if (lat === null || lng === null) {
                // Try ipinfo.io first
                try {
                    const res = await fetch('https://ipinfo.io/json', { signal: AbortSignal.timeout(5000) });
                    if (res.ok) {
                        const data = await res.json();
                        if (data.loc) {
                            const [la, ln] = data.loc.split(',').map(Number);
                            if (!isNaN(la) && !isNaN(ln)) { lat = la; lng = ln; }
                        }
                    }
                } catch { /* try next */ }

                // Fallback: ipapi.co
                if (lat === null || lng === null) {
                    try {
                        const res = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(5000) });
                        if (res.ok) {
                            const data = await res.json();
                            if (data.latitude && data.longitude) {
                                lat = data.latitude;
                                lng = data.longitude;
                            }
                        }
                    } catch { /* nothing */ }
                }
            }

            if (lat === null || lng === null) {
                toast.error('Не удалось определить местоположение.');
                return;
            }

            // ── Step 3: Try OSM reverse geocode → resolveGermanCity ──
            let resolvedCity: string | null = null;
            const osmCity = await getCityFromCoords(lat, lng);
            if (osmCity) {
                resolvedCity = resolveGermanCity(osmCity);
            }

            // ── Step 4: If OSM didn't match, find NEAREST city from our DB ──
            if (!resolvedCity) {
                const nearest = findNearestCity(lat, lng);
                if (nearest && nearest.distance < 150) {
                    resolvedCity = nearest.name;
                    lat = nearest.lat;
                    lng = nearest.lng;
                }
            }

            if (resolvedCity) {
                const coords = getCoordsForCity(resolvedCity);
                setValue(resolvedCity);
                onSelect(resolvedCity, coords?.lat ?? lat, coords?.lng ?? lng);
                toast.success(`Ваше местоположение: ${resolvedCity}`);
            } else {
                toast.error('Не удалось определить город.');
            }
        } catch {
            toast.error('Не удалось определить город.');
        } finally {
            setIsLocating(false);
            locatingLockRef.current = false;
        }
    };

    return (
        <div ref={wrapperRef} className="relative w-full">
            <Input
                ref={focusRef}
                value={value}
                onChange={handleInputChange}
                disabled={isLocating}
                onFocus={() => {
                    setIsFocused(true);
                    updateSuggestions(value);
                }}
                className={cn("pr-10", className, isLocating && "opacity-70")}
                placeholder={isLocating ? "Определяем..." : "Город..."}
            />
            <button
                type="button"
                onClick={handleGeolocation}
                disabled={isLocating}
                className={cn("absolute right-3 top-1/2 -translate-y-1/2 transition-colors", isLocating ? "text-booking-primary" : "text-gray-400 hover:text-primary")}
                title="Мое местоположение"
            >
                {isLocating ? <Loader2 className="w-5 h-5 animate-spin" /> : <MapPin className="w-5 h-5" />}
            </button>

            {isFocused && (
                <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 text-left animate-fade-in max-h-80 overflow-y-auto">
                    <div
                        onClick={handleGeolocation}
                        className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors flex items-center gap-3 text-sm text-primary font-medium border-b border-gray-50"
                    >
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <MapPin className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex flex-col">
                            <span>Мое местоположение</span>
                            <span className="text-xs text-gray-400 font-normal">Найти услуги рядом со мной</span>
                        </div>
                    </div>

                    {suggestions.map((city) => (
                        <div
                            key={city}
                            onClick={() => handleSelect(city)}
                            className="px-4 py-2.5 hover:bg-gray-50 cursor-pointer transition-colors flex items-center gap-3 text-sm text-gray-700"
                        >
                            <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                            <span>{city}</span>
                        </div>
                    ))}

                    {suggestions.length === 0 && value.length > 0 && (
                        <div className="px-4 py-3 text-sm text-gray-400 text-center">
                            Город не найден
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
