"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";

const LocationAutocomplete = dynamic(
    () => import("@/components/LocationAutocomplete").then(mod => mod.LocationAutocomplete),
    { ssr: false, loading: () => <div className="h-14 w-full animate-pulse rounded-full bg-white/5" /> },
);

interface Props {
    serviceName: string;
}

export default function ServiceLandingClient({ serviceName }: Props) {
    const t = useTranslations('forms.serviceSearch');
    const router = useRouter();
    const [locationQuery, setLocationQuery] = useState("");
    const [coordinates, setCoordinates] = useState<{ lat: number | null; lng: number | null }>({ lat: null, lng: null });
    const [radius] = useState(10);
    const [locationError, setLocationError] = useState(false);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();

        if (!locationQuery.trim()) {
            setLocationError(true);
            toast.error(t('cityRequired'));
            setTimeout(() => setLocationError(false), 3000);
            return;
        }

        setLocationError(false);
        const params = new URLSearchParams();
        params.set("q", serviceName);
        params.set("location", locationQuery.trim());
        if (coordinates.lat && coordinates.lng) {
            params.set("lat", coordinates.lat.toString());
            params.set("lng", coordinates.lng.toString());
            params.set("radius", radius.toString());
        }

        router.push(`/search?${params.toString()}`);
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-[#F4EFE6] w-full flex flex-col items-center">
            {/* Hero Section */}
            <section className="w-full max-w-4xl px-6 md:px-12 text-center pt-16 md:pt-24 pb-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                >
                    <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-[#1B2A23]/5 border border-[#1B2A23]/10 mb-6">
                        <Sparkles className="w-4 h-4 text-[#C2A363]" strokeWidth={1.5} />
                        <span className="text-sm text-[#1B2A23]/70 font-light tracking-wide">
                            SVOI Premium Network
                        </span>
                    </div>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight text-gray-900 mb-6">
                        {serviceName}
                    </h1>
                    <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto font-light leading-relaxed">
                        {t('subtitle')}
                    </p>
                </motion.div>
            </section>

            {/* City Search Box — The Bridge */}
            <section className="w-full max-w-3xl px-6 md:px-12 mb-20">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                    className="bg-[#1B2A23] border-2 border-[#C2A363] rounded-3xl p-8 md:p-12 shadow-[0_20px_60px_rgba(27,42,35,0.15)]"
                >
                    <h2 className="text-2xl md:text-3xl font-medium tracking-tight text-white text-center mb-8">
                        {t('cityQuestion')}
                    </h2>

                    <form
                        onSubmit={handleSearch}
                        className="flex flex-col md:flex-row gap-3 relative"
                    >
                        {/* Location Input (smart autocomplete) */}
                        <div className="flex-1 min-w-0">
                            <div
                                className={cn(
                                    "flex items-center px-4 bg-white/10 rounded-full border transition-all h-14",
                                    locationError
                                        ? "border-red-400"
                                        : "border-white/20 focus-within:border-[#C2A363]"
                                )}
                            >
                                <LocationAutocomplete
                                    defaultValue={locationQuery}
                                    onSelect={(addr, lat, lng) => {
                                        setLocationQuery(addr);
                                        setCoordinates({ lat, lng });
                                        if (locationError) setLocationError(false);
                                    }}
                                    className={cn(
                                        "w-full h-full bg-transparent border-none focus:ring-0 focus:outline-none text-white placeholder-white/40 text-[16px] md:text-base font-light",
                                        locationError && "text-red-300 placeholder-red-300/50"
                                    )}
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            className="h-14 px-8 rounded-full bg-[#C2A363] text-[#1B2A23] font-medium tracking-wide hover:bg-[#d4b574] transition-all duration-200 flex items-center justify-center space-x-2 whitespace-nowrap"
                        >
                            <span>{t('submit')}</span>
                            <ArrowRight className="w-5 h-5" strokeWidth={2} />
                        </button>
                    </form>
                </motion.div>
            </section>

        </div>
    );
}
