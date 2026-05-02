'use client';

import { useState, useRef, useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { SlidersHorizontal, Check } from 'lucide-react';
import { PROVIDER_LANGUAGE_OPTIONS } from '@/lib/provider-languages';

type FilterKey = 'today' | 'homeVisit' | 'promo' | 'inSalon' | 'cardPayment' | 'instantBooking';

const FILTER_KEYS: FilterKey[] = ['today', 'homeVisit', 'promo', 'inSalon', 'cardPayment', 'instantBooking'];

export function SearchQuickFilters() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const t = useTranslations('search.filters');
    const [open, setOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const today = searchParams.get('today') === 'true';
    const homeVisit = searchParams.get('homeVisit') === 'true';
    const promo = searchParams.get('promo') === 'true';
    const inSalon = searchParams.get('inSalon') === 'true';
    const cardPayment = searchParams.get('cardPayment') === 'true';
    const instantBooking = searchParams.get('instantBooking') === 'true';
    const activeLanguage = searchParams.get('language');

    const activeCount = [today, homeVisit, promo, inSalon, cardPayment, instantBooking, Boolean(activeLanguage)].filter(Boolean).length;

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleFilter = (key: FilterKey) => {
        const params = new URLSearchParams(searchParams.toString());
        if (params.get(key) === 'true') {
            params.delete(key);
        } else {
            params.set(key, 'true');
        }
        const queryString = params.toString();
        const target = `${pathname}${queryString ? `?${queryString}` : ''}`;
        router.push(target, { scroll: false });
        router.refresh();
    };

    const isActive = (key: FilterKey) => {
        return searchParams.get(key) === 'true';
    };

    const toggleLanguage = (language: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (params.get('language') === language) {
            params.delete('language');
        } else {
            params.set('language', language);
        }
        const queryString = params.toString();
        const target = `${pathname}${queryString ? `?${queryString}` : ''}`;
        router.push(target, { scroll: false });
        router.refresh();
    };

    return (
        <nav
            aria-label={t('title')}
            className="sticky top-0 z-10 -mx-4 mb-4 border-b border-[#E5E0D8]/50 bg-[var(--app-shell-bg)] px-4 py-2 md:-mx-6 md:px-6"
        >
            <div className="flex items-center">
                <div className="relative shrink-0" ref={menuRef}>
                    <button
                        type="button"
                        onClick={() => setOpen((prev) => !prev)}
                        className="flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2 text-sm text-stone-600 transition-colors hover:bg-stone-50"
                        aria-expanded={open}
                        aria-haspopup="menu"
                        aria-label={t('title')}
                    >
                        <SlidersHorizontal className="h-4 w-4 text-stone-500" />
                        <span className="whitespace-nowrap">
                            {t('title')}
                            {activeCount > 0 && (
                                <span className="ml-1 font-medium text-stone-800">
                                    • {activeCount}
                                </span>
                            )}
                        </span>
                    </button>

                    {open && (
                        <div
                            className="absolute left-0 top-full z-50 mt-2 w-56 rounded-2xl border border-stone-100 bg-white p-2 shadow-xl"
                            role="menu"
                        >
                            {FILTER_KEYS.map((key) => {
                                const active = isActive(key);
                                return (
                                    <button
                                        key={key}
                                        type="button"
                                        role="menuitemcheckbox"
                                        aria-checked={active}
                                        onClick={() => toggleFilter(key)}
                                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors hover:bg-stone-50 ${
                                            active
                                                ? 'bg-stone-50 font-medium text-stone-900'
                                                : 'text-stone-600'
                                        }`}
                                    >
                                        <span
                                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                                                active
                                                    ? 'border-stone-300 bg-stone-100 text-stone-700'
                                                    : 'border-stone-200 bg-white'
                                            }`}
                                        >
                                            {active ? (
                                                <Check className="h-3 w-3" strokeWidth={2.5} />
                                            ) : null}
                                        </span>
                                        {t(key)}
                                    </button>
                                );
                            })}
                            <div className="my-2 border-t border-stone-100" />
                            <div className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-400">
                                {t('languageHeader')}
                            </div>
                            {PROVIDER_LANGUAGE_OPTIONS.map(({ value, label, flag }) => {
                                const active = activeLanguage === value;
                                return (
                                    <button
                                        key={value}
                                        type="button"
                                        onClick={() => toggleLanguage(value)}
                                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors hover:bg-stone-50 ${
                                            active ? 'bg-stone-50 font-medium text-stone-900' : 'text-stone-600'
                                        }`}
                                    >
                                        <span
                                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                                                active
                                                    ? 'border-stone-300 bg-stone-100 text-stone-700'
                                                    : 'border-stone-200 bg-white'
                                            }`}
                                        >
                                            {active ? <Check className="h-3 w-3" strokeWidth={2.5} /> : null}
                                        </span>
                                        <span>
                                            {flag} {label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}
