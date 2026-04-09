'use client';

import { useEffect, useState } from 'react';
import MasterCard from './MasterCard';
import { ArrowRight, Loader2 } from 'lucide-react';

interface MasterData {
    id: number;
    slug: string;
    name: string;
    category: string;
    city: string;
    isVerified: boolean;
    avgRating: string;
    workPhotoUrl: string | null;
    services: { title: string; price: number; durationMin: number }[];
}

export default function MasterGallery() {
    const [masters, setMasters] = useState<MasterData[]>([]);
    const [loading, setLoading] = useState(true);
    const [localLoading, setLocalLoading] = useState(false);
    const [heading, setHeading] = useState('Топ-мастера платформы');
    const [localModeStatus, setLocalModeStatus] = useState<'idle' | 'active' | 'empty'>('idle');

    useEffect(() => {
        setLoading(true);
        fetch('/api/homepage/masters')
            .then((res) => res.json())
            .then((data: MasterData[]) => {
                setMasters(data);
                setHeading('Топ-мастера платформы');
                setLoading(false);
            })
            .catch((err) => {
                console.error('[MasterGallery] Fetch error:', err);
                setLoading(false);
            });
    }, []);

    const fetchGlobalMasters = () => {
        setLocalLoading(true);
        fetch('/api/homepage/masters')
            .then((res) => res.json())
            .then((data: MasterData[]) => {
                setMasters(data);
                setHeading('Топ-мастера платформы');
                setLocalModeStatus('idle');
                setLocalLoading(false);
            })
            .catch((err) => {
                console.error('[MasterGallery] Fetch global error:', err);
                setLocalLoading(false);
            });
    };

    const fetchMastersByCity = async (city: string): Promise<boolean> => {
        const res = await fetch(`/api/homepage/masters?city=${encodeURIComponent(city)}`);
        const data: MasterData[] = await res.json();
        if (data.length > 0) {
            setMasters(data);
            setHeading(`Мастера — ${city}`);
            setLocalModeStatus('active');
            return true;
        }
        return false;
    };

    const detectCityViaGPS = (): Promise<string> => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation not supported'));
                return;
            }
            navigator.geolocation.getCurrentPosition(
                async (pos) => {
                    try {
                        const { latitude, longitude } = pos.coords;
                        const res = await fetch(
                            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
                        );
                        const data = await res.json();
                        const city = data?.city || data?.locality;
                        if (city) {
                            resolve(city);
                        } else {
                            reject(new Error('City not found in reverse geocode response'));
                        }
                    } catch (e) {
                        reject(e);
                    }
                },
                (err) => reject(err),
                { enableHighAccuracy: false, timeout: 30000, maximumAge: 600000 }
            );
        });
    };

    const fetchLocalMasters = async () => {
        setLocalLoading(true);
        setLocalModeStatus('idle');

        try {
            // 1. CHECK LOCAL STORAGE FIRST (Silent & Fast)
            const storedCity = localStorage.getItem('svoi_last_city');
            if (storedCity) {
                const found = await fetchMastersByCity(storedCity);
                if (found) {
                    setLocalLoading(false);
                    return;
                }
            }

            // 2. localStorage empty or had no masters — try GPS + reverse geocode
            const detectedCity = await detectCityViaGPS();
            localStorage.setItem('svoi_last_city', detectedCity);
            const found = await fetchMastersByCity(detectedCity);
            if (!found) {
                setLocalModeStatus('empty');
            }
        } catch (err) {
            console.error('[MasterGallery] Local lookup failed:', err);
            setLocalModeStatus('empty');
        } finally {
            setLocalLoading(false);
        }
    };

    if (loading) {
        return (
            <section className="py-24 px-8 bg-[#f0ebe4]">
                <div className="max-w-screen-2xl mx-auto">
                    <div className="h-96 w-full animate-pulse rounded-2xl bg-[#e8e3dc]" />
                </div>
            </section>
        );
    }

    if (masters.length === 0) return null;

    const showArrows = masters.length > 4;

    return (
        <section className="py-24 px-8 bg-[#f0ebe4]">
            <div className="max-w-screen-2xl mx-auto">
                {/* Section Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
                    <div className="max-w-xl">
                        <span className="text-xs font-bold uppercase tracking-[0.2em] text-booking-primary mb-3 block">
                            Выбор SVOI
                        </span>

                        <div className="flex flex-col gap-4">
                            <h2 className="text-4xl md:text-5xl font-bold tracking-tighter text-booking-textMain">
                                {heading}
                            </h2>

                            {localModeStatus !== 'active' ? (
                                <div>
                                    <button
                                        onClick={fetchLocalMasters}
                                        disabled={localLoading}
                                        className="inline-flex items-center gap-1.5 text-sm font-bold text-booking-primary hover:text-emerald-800 transition-colors group"
                                    >
                                        {localLoading ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Ищем...
                                            </>
                                        ) : (
                                            <>
                                                Показать мастеров рядом?
                                                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 duration-300 transition-transform" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            ) : (
                                <div>
                                    <button
                                        onClick={fetchGlobalMasters}
                                        disabled={localLoading}
                                        className="inline-flex items-center gap-1.5 text-sm font-bold text-booking-primary hover:text-emerald-800 transition-colors group"
                                    >
                                        {localLoading ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Загрузка...
                                            </>
                                        ) : (
                                            <>
                                                <ArrowRight className="h-4 w-4 rotate-180 group-hover:-translate-x-1 duration-300 transition-transform" />
                                                Показать всех мастеров платформы
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}

                            {localModeStatus === 'empty' && (
                                <p className="text-sm font-medium text-amber-700 bg-amber-50 py-2 px-3 rounded-lg w-fit">
                                    В вашем регионе пока нет мастеров, посмотрите лучших специалистов платформы.
                                </p>
                            )}

                            <p className="text-booking-textMuted text-lg leading-relaxed mt-2">
                                Мы проверяем каждого мастера на соответствие золотому стандарту качества SVOI.
                            </p>
                        </div>
                    </div>

                    {showArrows && (
                        <div className="flex gap-4">
                            <button className="w-12 h-12 rounded-full border border-stone-300 flex items-center justify-center hover:bg-white transition-all">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <button className="w-12 h-12 rounded-full border border-stone-300 flex items-center justify-center hover:bg-white transition-all">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full items-start justify-start">
                    {masters.map((master) => (
                        <div key={master.id} className="w-full">
                            <MasterCard
                                slug={master.slug}
                                name={master.name}
                                category={master.category}
                                city={master.city}
                                isVerified={master.isVerified}
                                avgRating={master.avgRating}
                                workPhotoUrl={master.workPhotoUrl}
                                services={master.services}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
