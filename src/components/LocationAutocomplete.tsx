'use client';

import { useState, useEffect, useRef } from 'react';
import usePlacesAutocomplete, {
    getGeocode,
    getLatLng,
} from 'use-places-autocomplete';
import { useLoadScript } from '@react-google-maps/api';
import { Input } from '@/components/ui/input';
import { MapPin, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const libraries: ("places")[] = ["places"];

interface LocationAutocompleteProps {
    onSelect: (address: string, lat: number | null, lng: number | null) => void;
    defaultValue?: string;
    className?: string;
    focusRef?: React.Ref<HTMLInputElement>;
}

export function LocationAutocomplete({ onSelect, defaultValue = '', className, focusRef }: LocationAutocompleteProps) {
    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
        libraries,
    });

    useEffect(() => {
        if (loadError) {
            console.error('Google Maps Load Error:', loadError);
        }
    }, [loadError]);

    if (!isLoaded) {
        return (
            <div className="relative w-full">
                <Input
                    disabled
                    placeholder="Загрузка карт..."
                    className={className}
                />
                <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-gray-400" />
            </div>
        );
    }

    return <LocationInput onSelect={onSelect} defaultValue={defaultValue} className={className} focusRef={focusRef} />;
}

function LocationInput({ onSelect, defaultValue, className, focusRef }: LocationAutocompleteProps) {
    const {
        ready,
        value,
        suggestions: { status, data },
        setValue,
        clearSuggestions,
    } = usePlacesAutocomplete({
        requestOptions: {
            language: 'ru', // Force Russian results
            componentRestrictions: { country: ['de'] },
        },
        debounce: 300,
        defaultValue,
    });

    const [isFocused, setIsFocused] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Keep value in sync if default changes (optional)
    useEffect(() => {
        if (defaultValue) setValue(defaultValue, false);
    }, [defaultValue, setValue]);

    // Click outside to close
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

    const handleSelect = async (address: string) => {
        setValue(address, false);
        clearSuggestions();
        setIsFocused(false);

        try {
            const results = await getGeocode({ address });
            const { lat, lng } = await getLatLng(results[0]);
            onSelect(address, lat, lng);
        } catch (error) {
            console.error("Error: ", error);
            // Even if geocoding fails, we can at least return the address
            onSelect(address, null, null);
        }
    };

    const handleGeolocation = () => {
        if (!navigator.geolocation) return;

        navigator.geolocation.getCurrentPosition(
            ({ coords }) => {
                const { latitude, longitude } = coords;

                getGeocode({ location: { lat: latitude, lng: longitude } })
                    .then((results) => {
                        if (results[0]) {
                            const address = results[0].formatted_address;
                            setValue(address, false);
                            onSelect(address, latitude, longitude);
                        } else {
                            const fallback = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
                            setValue(fallback, false);
                            onSelect(fallback, latitude, longitude);
                        }
                        setIsFocused(true);
                    })
                    .catch((err) => {
                        console.error("Geocoding failed:", err);
                        setValue("Не удалось определить город", false);
                        setIsFocused(true);
                    });
            },
            (error) => {
                console.error("Geolocation error:", error);
            }
        );
    };

    return (
        <div ref={wrapperRef} className="relative w-full">
            <Input
                ref={focusRef}
                value={value}
                onChange={(e) => {
                    setValue(e.target.value);
                    if (e.target.value) onSelect(e.target.value, null, null);
                }}
                disabled={!ready}
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
                <MapPin className="w-5 h-5" />
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

                    {status === "OK" && data.map(({ place_id, description }) => (
                        <div
                            key={place_id}
                            onClick={() => handleSelect(description)}
                            className="px-4 py-2.5 hover:bg-gray-50 cursor-pointer transition-colors flex items-center gap-3 text-sm text-gray-700"
                        >
                            <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                            <span>{description}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
