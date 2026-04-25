import Link from "next/link";
import type { Metadata } from "next";
import { GERMAN_CITY_OPTIONS } from "@/lib/german-city-options";
import { CityDirectoryClient } from "./CityDirectoryClient";

export const metadata: Metadata = {
    title: "Каталог городов — Бьюти-мастера по всей Германии | Svoi.de",
    description:
        "Найдите премиум бьюти-мастеров в любом городе Германии: Берлин, Мюнхен, Гамбург, Франкфурт и ещё более 500 городов. Онлайн-запись на Svoi.de.",
    alternates: { canonical: "/locations" },
};

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

const allCitiesData: string[] = Array.from(
    new Set(
        GERMAN_CITY_OPTIONS
            .map((city) => city.germanName)
            .filter((name): name is string => Boolean(name))
    )
).sort((a, b) => a.localeCompare(b, "de"));

const popularDestinations = (
    <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-[#1B2A23] mb-8 px-2">
            Популярные направления
        </h2>
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {CITIES.map((city) => (
                <Link
                    key={city.id}
                    href={`/locations/${encodeURIComponent(city.name)}`}
                    className="group relative block h-[450px] rounded-3xl overflow-hidden bg-[#1B2A23] bg-cover bg-center border border-[#C2A363] hover:shadow-[0_0_40px_rgba(194,163,99,0.45)] hover:border-2 transition-shadow duration-500"
                    style={{ backgroundImage: `url('${city.image}')` }}
                >
                    <div className="absolute inset-0 bg-black/50 pointer-events-none z-0" />
                    <div className="relative z-10 flex flex-col h-full justify-end p-8 md:p-10 pointer-events-none">
                        <h3 className="text-3xl font-bold text-white mb-2 drop-shadow-md">
                            {city.name}
                        </h3>
                        <span className="block text-sm font-semibold text-[#C2A363] uppercase tracking-wider">
                            Найти мастера →
                        </span>
                    </div>
                </Link>
            ))}
        </section>
    </div>
);

export default function LocationsPage() {
    return (
        <div className="min-h-screen bg-[#F4EFE6] py-16 md:py-24">
            <section className="text-center px-6 md:px-8 max-w-4xl mx-auto">
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
                    Каталог городов
                </h1>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8 font-light leading-relaxed">
                    Найдите своего премиум-мастера в любом городе Германии.
                </p>
            </section>

            <CityDirectoryClient
                cities={allCitiesData}
                popularSection={popularDestinations}
            />
        </div>
    );
}
