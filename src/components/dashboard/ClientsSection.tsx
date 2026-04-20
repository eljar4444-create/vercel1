'use client';

import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Search, Loader2, Users } from 'lucide-react';

interface ClientRow {
    id: string;
    name: string;
    phone: string;
    email: string | null;
    totalBookings: number;
    totalSpent: number;
    noShows: number;
    lastVisit: string | null;
}

type SortKey = 'lastVisit' | 'totalSpent' | 'totalBookings' | 'noShows' | 'name';

interface ClientsSectionProps {
    profileId: number;
}

export function ClientsSection(_: ClientsSectionProps) {
    const [clients, setClients] = useState<ClientRow[]>([]);
    const [search, setSearch] = useState('');
    const [sortKey, setSortKey] = useState<SortKey>('lastVisit');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        const handle = setTimeout(async () => {
            setIsLoading(true);
            setError(null);
            try {
                const params = new URLSearchParams();
                if (search.trim()) params.set('q', search.trim());
                params.set('sortBy', sortKey);
                params.set('sortDir', sortDir);
                const res = await fetch(`/api/dashboard/clients?${params.toString()}`);
                if (!res.ok) {
                    if (!cancelled) setError('Не удалось загрузить клиентов');
                    return;
                }
                const data = await res.json();
                if (!cancelled) setClients(data.clients ?? []);
            } catch {
                if (!cancelled) setError('Ошибка сети');
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }, 250);

        return () => {
            cancelled = true;
            clearTimeout(handle);
        };
    }, [search, sortKey, sortDir]);

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortKey(key);
            setSortDir(key === 'name' ? 'asc' : 'desc');
        }
    };

    const arrow = (key: SortKey) =>
        sortKey === key ? (sortDir === 'asc' ? '↑' : '↓') : '';

    const totalRevenue = useMemo(
        () => clients.reduce((sum, c) => sum + (c.totalSpent || 0), 0),
        [clients],
    );

    return (
        <div className="bg-transparent">
            <div className="border-b border-gray-300 pb-4 mb-6">
                <div className="flex items-end justify-between">
                    <div>
                        <h2 className="text-base font-semibold text-slate-900">Клиенты</h2>
                        <p className="mt-0.5 text-xs text-stone-400">
                            {clients.length} {clients.length === 1 ? 'клиент' : 'клиентов'}
                            {totalRevenue > 0 && ` · ${Math.round(totalRevenue)} € совокупно`}
                        </p>
                    </div>
                </div>
            </div>

            <div className="mb-6 flex items-center gap-2">
                <Search className="h-4 w-4 text-gray-400" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Поиск по имени или телефону..."
                    className="bg-transparent border-b border-gray-300 focus:border-gray-900 rounded-none px-0 py-2 w-full max-w-md text-sm outline-none placeholder:text-gray-400 transition-colors"
                />
            </div>

            {error && (
                <div className="border-l-2 border-red-500 bg-red-50/40 px-3 py-2 mb-6 text-xs text-red-700">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-4 items-center text-xs uppercase tracking-wider text-gray-400 border-b border-gray-300 pb-4 mb-2">
                <button
                    type="button"
                    onClick={() => handleSort('name')}
                    className="text-left hover:text-gray-700"
                >
                    Клиент {arrow('name')}
                </button>
                <button
                    type="button"
                    onClick={() => handleSort('totalBookings')}
                    className="text-left hover:text-gray-700"
                >
                    Визиты {arrow('totalBookings')}
                </button>
                <button
                    type="button"
                    onClick={() => handleSort('totalSpent')}
                    className="text-left hover:text-gray-700"
                >
                    Оборот {arrow('totalSpent')}
                </button>
                <button
                    type="button"
                    onClick={() => handleSort('noShows')}
                    className="text-left hover:text-gray-700"
                >
                    Не пришёл {arrow('noShows')}
                </button>
                <button
                    type="button"
                    onClick={() => handleSort('lastVisit')}
                    className="text-left hover:text-gray-700"
                >
                    Последний визит {arrow('lastVisit')}
                </button>
                <span className="text-right">Действие</span>
            </div>

            {isLoading && clients.length === 0 ? (
                <div className="py-16 flex items-center justify-center text-gray-400">
                    <Loader2 className="h-5 w-5 animate-spin" />
                </div>
            ) : clients.length === 0 ? (
                <div className="border border-dashed border-gray-300 py-14 text-center">
                    <Users className="mx-auto mb-4 h-10 w-10 text-gray-300" />
                    <h3 className="text-base font-semibold text-slate-700">
                        {search ? 'Ничего не найдено' : 'Пока нет клиентов'}
                    </h3>
                    <p className="mx-auto mt-1 max-w-xs text-sm text-stone-400">
                        {search
                            ? 'Попробуйте изменить запрос.'
                            : 'Клиенты появятся здесь после первой записи.'}
                    </p>
                </div>
            ) : (
                <div>
                    {clients.map((c) => (
                        <div
                            key={c.id}
                            className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-4 items-center py-5 border-b border-gray-200/60 last:border-0"
                        >
                            <div className="min-w-0">
                                <div className="text-sm font-medium text-gray-900 truncate">
                                    {c.name}
                                </div>
                                <div className="text-xs text-gray-500 truncate">
                                    {c.phone}
                                </div>
                            </div>

                            <div className="text-sm text-gray-900 tabular-nums">
                                {c.totalBookings}
                            </div>

                            <div className="text-sm font-medium text-gray-900 tabular-nums">
                                {Math.round(c.totalSpent)} €
                            </div>

                            <div>
                                {c.noShows > 0 ? (
                                    <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700 tabular-nums">
                                        {c.noShows}
                                    </span>
                                ) : (
                                    <span className="text-xs text-gray-300">—</span>
                                )}
                            </div>

                            <div className="text-sm text-gray-600 tabular-nums">
                                {c.lastVisit
                                    ? format(new Date(c.lastVisit), 'dd MMM yyyy', { locale: ru })
                                    : <span className="text-gray-300">—</span>}
                            </div>

                            <div className="text-right">
                                <button
                                    type="button"
                                    className="text-xs font-medium text-gray-600 hover:text-gray-900 underline-offset-4 hover:underline"
                                    onClick={() => {
                                        // Future: navigate to client detail / booking history
                                    }}
                                >
                                    История
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
