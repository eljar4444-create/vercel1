"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useMemo, useState } from "react";
import { GERMAN_CITY_OPTIONS } from "@/lib/german-city-options";

// ─────────────────────────────────────────────────────────────────────────────
// Top 12 popular destinations — curated with local hero imagery.
// Drop assets into `public/` and keep the `image` paths in sync.
// ─────────────────────────────────────────────────────────────────────────────
const CITIES: { id: string; name: string; image: string }[] = [
    { id: "berlin",      name: "Berlin",      image: "/Berlin.jpg" },
    { id: "hamburg",     name: "Hamburg",     image: "/Hamburg.jpg" },
    { id: "munich",      name: "München",     image: "/Munich.jpg" },
    { id: "cologne",     name: "Köln",        image: "/Cologne.jpg" },
    { id: "frankfurt",   name: "Frankfurt",   image: "/Frankfurt.jpg" },
    { id: "stuttgart",   name: "Stuttgart",   image: "/Stuttgart.jpg" },
    { id: "duesseldorf", name: "Düsseldorf",  image: "/Düsseldorf.jpg" },
    { id: "leipzig",     name: "Leipzig",     image: "/Leipzig.jpg" },
    { id: "dortmund",    name: "Dortmund",    image: "/Dortmund.jpg" },
    { id: "essen",       name: "Essen",       image: "/Essen.jpg" },
    { id: "bremen",      name: "Bremen",      image: "/Bremen.jpg" },
    { id: "dresden",     name: "Dresden",     image: "/Dresden.jpg" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Full A-Z catalogue — ~600 German cities sourced from the shared constants.
// We derive a flat, deduplicated, German-name string array for the directory.
// ─────────────────────────────────────────────────────────────────────────────
const allCitiesData: string[] = Array.from(
    new Set(
        GERMAN_CITY_OPTIONS
            .map((city) => city.germanName)
            .filter((name): name is string => Boolean(name))
    )
).sort((a, b) => a.localeCompare(b, "de"));

// Normalise umlauts so "Ä"/"Ö"/"Ü" group under A/O/U in the directory index.
const getFirstLetter = (name: string): string => {
    const first = name.charAt(0).toUpperCase();
    const stripped = first.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return stripped || first;
};

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.08, delayChildren: 0.1 },
    },
};

const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
    },
};

export default function LocationsPage() {
    const [searchQuery, setSearchQuery] = useState("");

    // Case-insensitive filter across the full catalogue.
    const filteredCities = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return allCitiesData;
        return allCitiesData.filter((city) => city.toLowerCase().includes(query));
    }, [searchQuery]);

    // Group filtered cities by first letter, with alphabetically-sorted keys.
    const groupedCities = useMemo<Record<string, string[]>>(() => {
        const groups: Record<string, string[]> = {};
        for (const city of filteredCities) {
            const letter = getFirstLetter(city);
            (groups[letter] ||= []).push(city);
        }
        return Object.keys(groups)
            .sort((a, b) => a.localeCompare(b, "de"))
            .reduce<Record<string, string[]>>((acc, letter) => {
                acc[letter] = groups[letter].sort((a, b) => a.localeCompare(b, "de"));
                return acc;
            }, {});
    }, [filteredCities]);

    const sortedLetters = Object.keys(groupedCities);

    return (
        <div className="min-h-screen bg-[#F4EFE6] py-16 md:py-24">
            {/* Hero Section */}
            <section className="text-center px-6 md:px-8 max-w-4xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                >
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
                        Каталог городов
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8 font-light leading-relaxed">
                        Найдите своего премиум-мастера в любом городе Германии.
                    </p>

                    {/* Live Search */}
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        placeholder="Найти город..."
                        className="max-w-2xl mx-auto w-full px-6 py-4 rounded-full border border-gray-200 focus:border-[#C2A363] focus:ring-1 focus:ring-[#C2A363] outline-none text-gray-900 bg-white shadow-sm mb-16"
                    />
                </motion.div>
            </section>

            {/* Popular Destinations — hidden while the user is searching */}
            {!searchQuery && (
                <div className="max-w-7xl mx-auto px-4">
                    <h2 className="text-3xl font-bold text-[#1B2A23] mb-8 px-2">
                        Популярные направления
                    </h2>
                    <motion.section
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="grid grid-cols-1 md:grid-cols-2 gap-8"
                    >
                    {CITIES.map((city) => (
                        <motion.div key={city.id} variants={cardVariants}>
                            <Link
                                href={`/locations/${encodeURIComponent(city.name)}`}
                                className="group relative block h-[450px] rounded-3xl overflow-hidden bg-[#1B2A23] bg-cover bg-center border border-[#C2A363] hover:shadow-[0_0_40px_rgba(194,163,99,0.45)] hover:border-2 transition-shadow duration-500"
                                style={{ backgroundImage: `url('${city.image}')` }}
                            >
                                {/* Readability overlay strictly underneath text */}
                                <div className="absolute inset-0 bg-black/50 pointer-events-none z-0"></div>

                                {/* Textual content above overlays */}
                                <div className="relative z-10 flex flex-col h-full justify-end p-8 md:p-10 pointer-events-none">
                                    <h2 className="text-3xl font-bold text-white mb-2 drop-shadow-md">
                                        {city.name}
                                    </h2>
                                    <span className="block text-sm font-semibold text-[#C2A363] uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        Найти мастера →
                                    </span>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                    </motion.section>
                </div>
            )}

            {/* A-Z Directory */}
            <section className="max-w-7xl mx-auto px-4 md:px-8">
                {sortedLetters.length === 0 ? (
                    <p className="text-center text-gray-500 text-lg mt-12">
                        Ничего не найдено. Попробуйте другой запрос.
                    </p>
                ) : (
                    sortedLetters.map((letter) => (
                        <div key={letter}>
                            <h3 className="text-3xl font-bold text-[#1B2A23] border-b border-[#C2A363]/30 pb-2 mb-6 mt-12">
                                {letter}
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {groupedCities[letter].map((city) => (
                                    <Link
                                        key={city}
                                        href={`/locations/${encodeURIComponent(city)}`}
                                        className="text-gray-600 hover:text-[#C2A363] hover:underline underline-offset-4 transition-colors font-medium"
                                    >
                                        {city}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </section>
        </div>
    );
}
