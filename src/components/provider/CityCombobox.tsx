'use client';

import { useMemo, useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
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

type CityOption = {
    value: string;
    searchText: string;
    isPopular: boolean;
};

function prettifyCity(raw: string) {
    return raw
        .split(/[\s-]+/)
        .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1) : part))
        .join(' ');
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

    return { value, searchText: searchParts, isPopular: isPopularByNames || isPopularByValue };
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

    return (
        <div>
            <input type="hidden" name={name} value={value} />
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        type="button"
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="h-11 w-full justify-between rounded-xl border-gray-200 bg-gray-50 px-3 text-sm font-normal text-gray-900 hover:bg-gray-100"
                    >
                        <span className={cn('truncate', !value && 'text-gray-400')}>{value || placeholder}</span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
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
        </div>
    );
}
