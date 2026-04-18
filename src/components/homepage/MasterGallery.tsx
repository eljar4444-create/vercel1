'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, Variants } from 'framer-motion';
import MasterCard from './MasterCard';
import { ArrowRight, Loader2 } from 'lucide-react';

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.15
        }
    }
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.8, ease: "easeOut" }
    }
};

type ProviderType = 'SALON' | 'PRIVATE' | 'INDIVIDUAL';

interface MasterData {
    id: number;
    slug: string;
    name: string;
    category: string;
    city: string;
    isVerified: boolean;
    providerType: ProviderType;
    avgRating: string;
    reviewCount: number;
    workPhotoUrl: string | null;
    services: { title: string; price: number; durationMin: number }[];
}

type ProfileTab = 'FREELANCER' | 'SALON';

export default function MasterGallery() {
    const [masters, setMasters] = useState<MasterData[]>([]);
    const [loading, setLoading] = useState(true);
    const [localLoading, setLocalLoading] = useState(false);
    const [profileType, setProfileType] = useState<ProfileTab>('SALON');
    const [cityName, setCityName] = useState<string | null>(null);
    const [localModeStatus, setLocalModeStatus] = useState<'idle' | 'active' | 'empty'>('idle');
    const salonScrollRef = useRef<HTMLDivElement>(null);

    const scrollSalons = (direction: 'prev' | 'next') => {
        const el = salonScrollRef.current;
        if (!el) return;
        const card = el.querySelector('[data-salon-card]') as HTMLElement | null;
        const styles = window.getComputedStyle(el);
        const gap = parseFloat(styles.columnGap || styles.gap || '0') || 24;
        const step = (card?.offsetWidth ?? el.clientWidth / 3) + gap;
        el.scrollBy({ left: direction === 'next' ? step : -step, behavior: 'smooth' });
    };

    const filteredMasters = masters.filter((m) =>
        profileType === 'SALON' ? m.providerType === 'SALON' : m.providerType !== 'SALON'
    );

    const baseHeading = profileType === 'SALON' ? 'Топ-салоны платформы' : 'Топ-мастера платформы';
    const localizedHeading = profileType === 'SALON' ? `Салоны — ${cityName}` : `Мастера — ${cityName}`;
    const heading = localModeStatus === 'active' && cityName ? localizedHeading : baseHeading;

    useEffect(() => {
        setLoading(true);
        fetch('/api/homepage/masters')
            .then((res) => res.json())
            .then((data: MasterData[]) => {
                setMasters(data);
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
                setCityName(null);
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
            setCityName(city);
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

    const showArrows = profileType === 'SALON' && filteredMasters.length > 3;

    return (
        <section className="py-24 px-8 bg-[#f0ebe4]">
            <div className="max-w-screen-2xl mx-auto">
                {/* Section Header */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="flex flex-col items-center justify-center text-center mb-16 relative"
                >
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-booking-primary mb-3 block">
                        Выбор SVOI
                    </span>
                    
                    <div className="flex flex-col items-center gap-4 max-w-xl mx-auto">
                        <h2 className="text-4xl md:text-5xl font-bold tracking-tighter text-booking-textMain">
                            {heading}
                        </h2>

                        <p className="text-booking-textMuted text-lg leading-relaxed mt-2 mb-2">
                            Мы проверяем каждого мастера на соответствие золотому стандарту качества SVOI.
                        </p>

                        <div className="bg-gray-100 p-1 rounded-full inline-flex">
                            <button
                                type="button"
                                onClick={() => setProfileType('FREELANCER')}
                                className={
                                    profileType === 'FREELANCER'
                                        ? 'bg-white text-gray-900 shadow-sm rounded-full px-6 py-2 text-sm font-medium transition-all'
                                        : 'text-gray-500 hover:text-gray-700 px-6 py-2 text-sm font-medium transition-all'
                                }
                                aria-pressed={profileType === 'FREELANCER'}
                            >
                                Частные мастера
                            </button>
                            <button
                                type="button"
                                onClick={() => setProfileType('SALON')}
                                className={
                                    profileType === 'SALON'
                                        ? 'bg-white text-gray-900 shadow-sm rounded-full px-6 py-2 text-sm font-medium transition-all'
                                        : 'text-gray-500 hover:text-gray-700 px-6 py-2 text-sm font-medium transition-all'
                                }
                                aria-pressed={profileType === 'SALON'}
                            >
                                Салоны
                            </button>
                        </div>

                        {localModeStatus !== 'active' ? (
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
                        ) : (
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
                        )}

                        {localModeStatus === 'empty' && (
                            <p className="text-sm font-medium text-amber-700 bg-amber-50 py-2 px-3 rounded-lg w-fit mt-2">
                                В вашем регионе пока нет мастеров, посмотрите лучших специалистов платформы.
                            </p>
                        )}
                    </div>

                    {showArrows && (
                        <div className="hidden md:flex gap-4 absolute right-0 bottom-0">
                            <button
                                type="button"
                                onClick={() => scrollSalons('prev')}
                                aria-label="Предыдущие салоны"
                                className="w-12 h-12 rounded-full border border-stone-300 flex items-center justify-center hover:bg-white transition-all"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <button
                                type="button"
                                onClick={() => scrollSalons('next')}
                                aria-label="Следующие салоны"
                                className="w-12 h-12 rounded-full border border-stone-300 flex items-center justify-center hover:bg-white transition-all"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    )}
                </motion.div>

                {filteredMasters.length === 0 ? (
                    <div className="mx-auto max-w-md text-center py-12">
                        <p className="text-base font-medium text-booking-textMain">
                            {profileType === 'SALON'
                                ? 'В вашем районе пока нет добавленных салонов. Будьте первыми!'
                                : 'В вашем районе пока нет частных мастеров. Будьте первыми!'}
                        </p>
                    </div>
                ) : profileType === 'SALON' ? (
                    <motion.div
                        ref={salonScrollRef}
                        key={profileType}
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.2 }}
                        className="flex overflow-x-auto snap-x snap-mandatory gap-6 scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                    >
                        {filteredMasters.map((master) => (
                            <motion.div
                                key={master.id}
                                data-salon-card
                                variants={itemVariants}
                                className="snap-start shrink-0 w-full md:w-[calc((100%-1.5rem)/2)] lg:w-[calc((100%-3rem)/3)]"
                            >
                                <MasterCard
                                    slug={master.slug}
                                    name={master.name}
                                    category={master.category}
                                    city={master.city}
                                    isVerified={master.isVerified}
                                    avgRating={master.avgRating}
                                    reviewCount={master.reviewCount}
                                    workPhotoUrl={master.workPhotoUrl}
                                    providerType={master.providerType}
                                    services={master.services}
                                />
                            </motion.div>
                        ))}
                    </motion.div>
                ) : (
                    <motion.div
                        key={profileType}
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.2 }}
                        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 w-full"
                    >
                        {filteredMasters.map((master) => (
                            <motion.div key={master.id} variants={itemVariants}>
                                <MasterCard
                                    slug={master.slug}
                                    name={master.name}
                                    category={master.category}
                                    city={master.city}
                                    isVerified={master.isVerified}
                                    avgRating={master.avgRating}
                                    reviewCount={master.reviewCount}
                                    workPhotoUrl={master.workPhotoUrl}
                                    providerType={master.providerType}
                                    services={master.services}
                                />
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </div>
        </section>
    );
}
