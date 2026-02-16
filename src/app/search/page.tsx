
export const dynamic = 'force-dynamic'; // Отключаем кэш
export const revalidate = 0;

import prisma from "@/lib/prisma";
import Link from "next/link";

export default async function SearchPage({
    searchParams,
}: {
    searchParams: { [key: string]: string | string[] | undefined };
}) {
    console.log("--- SEARCH PAGE RENDER START ---");

    // 1. Пробуем получить всех, игнорируя фильтры
    let profiles: any[] = [];
    let error = null;

    try {
        profiles = await prisma.profile.findMany({
            // БЕЗ WHERE! Просто дай мне всё, что есть.
            take: 10,
        });
        console.log("Profiles found:", profiles.length);
    } catch (e: any) {
        console.error("DB Error:", e);
        error = e.message;
    }

    return (
        <div className="p-10 bg-gray-50 min-h-screen text-black">
            <div className="max-w-4xl mx-auto">

                <h1 className="text-3xl font-bold mb-6">🔍 ТЕСТ БАЗЫ ДАННЫХ</h1>

                <Link href="/" className="text-blue-500 underline mb-8 block">← На главную</Link>

                {/* Блок ошибок */}
                {error && (
                    <div className="bg-red-100 border border-red-500 text-red-700 p-4 rounded mb-6">
                        <h2 className="font-bold">ОШИБКА ПОДКЛЮЧЕНИЯ:</h2>
                        <pre className="whitespace-pre-wrap">{error}</pre>
                    </div>
                )}

                {/* Блок успеха */}
                <div className="bg-green-100 border border-green-500 text-green-800 p-4 rounded mb-6">
                    <p className="font-bold text-xl">Найдено профилей: {profiles.length}</p>
                    <p className="text-sm text-gray-600">Если тут 0 — значит база пустая или мы не в той базе.</p>
                </div>

                {/* Сырые данные */}
                <div className="bg-white p-6 rounded shadow">
                    <h3 className="font-bold mb-4">Данные из базы (RAW JSON):</h3>
                    <pre className="bg-gray-900 text-green-400 p-4 rounded overflow-auto text-xs">
                        {JSON.stringify(profiles, null, 2)}
                    </pre>
                </div>

            </div>
        </div>
    );
}
