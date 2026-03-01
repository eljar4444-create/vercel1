'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Application error:', error);
    }, [error]);

    return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-12">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
                <AlertCircle className="h-7 w-7 text-red-600" />
            </div>
            <h1 className="mt-4 text-xl font-semibold text-slate-900">Что-то пошло не так</h1>
            <p className="mt-2 max-w-md text-center text-sm text-slate-500">
                Ошибка при загрузке. Проверьте подключение к интернету и к базе данных (если приложение использует БД).
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <button
                    type="button"
                    onClick={() => reset()}
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
                >
                    <RefreshCw className="h-4 w-4" />
                    Попробовать снова
                </button>
                <Link
                    href="/"
                    className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                    На главную
                </Link>
            </div>
        </div>
    );
}
