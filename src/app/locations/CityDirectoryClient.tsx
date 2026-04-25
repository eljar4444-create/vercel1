"use client";

import Link from "next/link";
import { ReactNode, useMemo, useState } from "react";

const getFirstLetter = (name: string): string => {
    const first = name.charAt(0).toUpperCase();
    const stripped = first.normalize("NFD").replace(/[̀-ͯ]/g, "");
    return stripped || first;
};

export function CityDirectoryClient({
    cities,
    popularSection,
}: {
    cities: string[];
    popularSection?: ReactNode;
}) {
    const [searchQuery, setSearchQuery] = useState("");

    const filteredCities = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return cities;
        return cities.filter((city) => city.toLowerCase().includes(query));
    }, [cities, searchQuery]);

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
    const isSearching = searchQuery.trim().length > 0;

    return (
        <>
            <div className="text-center px-6 md:px-8 max-w-4xl mx-auto">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Найти город..."
                    className="max-w-2xl mx-auto w-full px-6 py-4 rounded-full border border-gray-200 focus:border-[#C2A363] focus:ring-1 focus:ring-[#C2A363] outline-none text-gray-900 bg-white shadow-sm mb-16"
                />
            </div>

            {!isSearching && popularSection}

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
        </>
    );
}
