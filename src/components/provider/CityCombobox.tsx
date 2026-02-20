'use client';

import { useMemo, useState } from 'react';
import { Check, ChevronsUpDown, Loader2, LocateFixed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { GERMAN_CITIES } from '@/constants/germanCities';
import toast from 'react-hot-toast';

type CityOption = {
    value: string;
    searchText: string;
    isPopular: boolean;
    aliases: string[];
};

function prettifyCity(raw: string) {
    return raw
        .split(/[\s-]+/)
        .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1) : part))
        .join(' ');
}

function normalizeCityName(value: string) {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-zа-яё\s-]/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
}

const POPULAR_CITY_TOKENS = new Set([
    'berlin', 'берлин',
    'hamburg', 'гамбург',
    'münchen', 'munchen', 'мюнхен',
    'köln', 'koeln', 'кёльн', 'кельн',
    'frankfurt', 'frankfurt am main', 'франкфурт', 'франкфурт-на-майне',
    'stuttgart', 'штутгарт',
    'düsseldorf', 'duesseldorf', 'дюссельдорф',
    'leipzig', 'лейпциг',
    'dortmund', 'дортмунд',
    'essen', 'эссен',
    'bremen', 'бремен',
    'dresden', 'дрезден',
    'hannover', 'ганновер',
    'nürnberg', 'nuernberg', 'нюрнберг',
]);

const CITY_OPTIONS: CityOption[] = GERMAN_CITIES.map((city: any) => {
    const names = Array.isArray(city.names) ? city.names : [];
    const cyrillicName = names.find((name: string) => /[а-яё]/i.test(name));
    const primaryName = cyrillicName || names[0] || city.data?.display_name?.split(',')?.[0] || '';
    const value = prettifyCity(primaryName.trim());
    const searchParts = [
        ...names,
        ...(Array.isArray(city.triggers) ? city.triggers : []),
        city.data?.display_name || '',
        value,
    ]
        .map((part) => String(part).toLowerCase())
        .join(' ');

    const isPopularByNames = names.some((name: string) => POPULAR_CITY_TOKENS.has(String(name).toLowerCase()));
    const isPopularByValue = POPULAR_CITY_TOKENS.has(value.toLowerCase());
    const aliases = [
        ...names,
        city.data?.display_name || '',
        value,
    ]
        .map((part) => normalizeCityName(String(part)))
        .filter(Boolean);

    return { value, searchText: searchParts, isPopular: isPopularByNames || isPopularByValue, aliases };
}).filter((item) => item.value);

interface CityComboboxProps {
    name: string;
    value: string;
    onValueChange: (value: string) => void;
    placeholder?: string;
}

export function CityCombobox({
    name,
    value,
    onValueChange,
    placeholder = 'Начните вводить ваш город...',
}: CityComboboxProps) {
    const [open, setOpen] = useState(false);
    const [popularOnly, setPopularOnly] = useState(false);
    const [isGeoLoading, setIsGeoLoading] = useState(false);

    const uniqueCities = useMemo(() => {
        const seen = new Set<string>();
        return CITY_OPTIONS.filter((city) => {
            if (seen.has(city.value)) return false;
            seen.add(city.value);
            return true;
        });
    }, []);

    const displayedCities = useMemo(
        () => (popularOnly ? uniqueCities.filter((city) => city.isPopular) : uniqueCities),
        [uniqueCities, popularOnly]
    );

    const aliasMap = useMemo(() => {
        const map = new Map<string, string>();
        for (const city of uniqueCities) {
            map.set(normalizeCityName(city.value), city.value);
            for (const alias of city.aliases) {
                if (!map.has(alias)) map.set(alias, city.value);
            }
        }
        return map;
    }, [uniqueCities]);

    const resolveCityFromGeolocation = (rawCity: string) => {
        const normalized = normalizeCityName(rawCity);
        if (!normalized) return null;

        const direct = aliasMap.get(normalized);
        if (direct) return direct;

        const fallbackMap: Record<string, string> = {
            cologne: 'кёльн',
            munich: 'мюнхен',
            nuremberg: 'нюрнберг',
            frankfurt: 'франкфурт',
            dusseldorf: 'дюссельдорф',
        };
        const mapped = fallbackMap[normalized];
        if (mapped) {
            const resolved = aliasMap.get(mapped);
            if (resolved) return resolved;
        }

        let fuzzyMatch: string | null = null;
        aliasMap.forEach((valueFromMap, alias) => {
            if (!fuzzyMatch && (alias.includes(normalized) || normalized.includes(alias))) {
                fuzzyMatch = valueFromMap;
            }
        });
        if (fuzzyMatch) return fuzzyMatch;

        return null;
    };

    const handleGeolocation = async (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        event.stopPropagation();

        if (!navigator.geolocation || isGeoLoading) {
            toast.error('Геолокация недоступна в вашем браузере');
            return;
        }

        setIsGeoLoading(true);
        try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 60000,
                });
            });

            const lat = position.coords.latitude;
            const lon = position.coords.longitude;

            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`,
                {
                    headers: {
                        'Accept-Language': 'de,en',
                    },
                }
            );

            if (!response.ok) {
                throw new Error('reverse-geocoding-failed');
            }

            const data = await response.json();
            const address = data?.address || {};
            const rawCity =
                address.city ||
                address.town ||
                address.municipality ||
                address.county ||
                '';

            const matchedCity = resolveCityFromGeolocation(String(rawCity));
            if (!matchedCity) {
                toast.error('Ваш город не найден в базе. Выберите ближайший крупный город из списка вручную');
                return;
            }

            onValueChange(matchedCity);
            toast.success(`Определен город: ${matchedCity}`);
        } catch (error) {
            if ((error as GeolocationPositionError)?.code === 1) {
                toast.error('Доступ к геолокации запрещен');
            } else {
                toast.error('Не удалось определить город автоматически');
            }
        } finally {
            setIsGeoLoading(false);
        }
    };

    return (
        <div>
            <input type="hidden" name={name} value={value} />
            <div className="relative">
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            type="button"
                            variant="outline"
                            role="combobox"
                            aria-expanded={open}
                            className="h-11 w-full justify-start rounded-xl border-gray-200 bg-gray-50 px-3 pr-20 text-sm font-normal text-gray-900 hover:bg-gray-100"
                        >
                            <span className={cn('truncate', !value && 'text-gray-400')}>{value || placeholder}</span>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                        <Command>
                            <div className="flex items-center gap-1 border-b px-2 py-2">
                                <button
                                    type="button"
                                    onClick={() => setPopularOnly(false)}
                                    className={cn(
                                        'rounded-md px-2.5 py-1 text-xs font-medium transition',
                                        !popularOnly ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                                    )}
                                >
                                    Все
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPopularOnly(true)}
                                    className={cn(
                                        'rounded-md px-2.5 py-1 text-xs font-medium transition',
                                        popularOnly ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                                    )}
                                >
                                    Популярные
                                </button>
                            </div>
                            <CommandInput placeholder={placeholder} />
                            <CommandList>
                                <CommandEmpty>
                                    Город не найден. Выберите ближайший крупный город
                                </CommandEmpty>
                                <CommandGroup>
                                    {displayedCities.map((city) => (
                                        <CommandItem
                                            key={city.value}
                                            value={`${city.value} ${city.searchText}`}
                                            onSelect={() => {
                                                onValueChange(city.value);
                                                setOpen(false);
                                            }}
                                        >
                                            <Check
                                                className={cn(
                                                    'mr-2 h-4 w-4',
                                                    value === city.value ? 'opacity-100' : 'opacity-0'
                                                )}
                                            />
                                            <span className="truncate">{city.value}</span>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
                <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center gap-1">
                    <button
                        type="button"
                        onClick={handleGeolocation}
                        disabled={isGeoLoading}
                        title="Определить мой город"
                        aria-label="Определить мой город"
                        className="pointer-events-auto inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-200 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isGeoLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <LocateFixed className="h-4 w-4" />
                        )}
                    </button>
                    <ChevronsUpDown className="h-4 w-4 shrink-0 text-slate-400" />
                </div>
            </div>
        </div>
    );
}
