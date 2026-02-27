'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart } from 'lucide-react';
import { toggleFavorite } from '@/app/actions/favorites';
import toast from 'react-hot-toast';

interface FavoriteButtonProps {
    providerProfileId: number;
    initialIsFavorited: boolean;
    /** Optional: 'card' for search card corner, 'list' for dashboard list */
    variant?: 'card' | 'list';
    onToggle?: (isFavorited: boolean) => void;
}

export function FavoriteButton({
    providerProfileId,
    initialIsFavorited,
    variant = 'card',
    onToggle,
}: FavoriteButtonProps) {
    const [isFavorited, setIsFavorited] = useState(initialIsFavorited);
    const [pending, setPending] = useState(false);
    const router = useRouter();

    const handleClick = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (pending) return;
        const next = !isFavorited;
        setIsFavorited(next);
        setPending(true);
        const result = await toggleFavorite(providerProfileId);
        setPending(false);
        if (result.success) {
            setIsFavorited(result.isFavorited);
            onToggle?.(result.isFavorited);
            if (result.isFavorited) toast.success('Добавлено в избранное');
            else {
                toast.success('Удалено из избранного');
                if (variant === 'list') router.refresh();
            }
        } else {
            setIsFavorited(isFavorited);
            toast.error(result.error ?? 'Ошибка');
        }
    };

    if (variant === 'list') {
        return (
            <button
                type="button"
                onClick={handleClick}
                disabled={pending}
                aria-label={isFavorited ? 'Удалить из избранного' : 'Добавить в избранное'}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
            >
                <Heart
                    className={`h-4 w-4 ${isFavorited ? 'fill-red-500 text-red-500' : ''}`}
                />
            </button>
        );
    }

    return (
        <button
            type="button"
            onClick={handleClick}
            disabled={pending}
            aria-label={isFavorited ? 'Удалить из избранного' : 'В избранное'}
            className="absolute top-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-500 shadow-sm backdrop-blur transition hover:bg-white hover:text-slate-700 disabled:opacity-50"
        >
            <Heart
                className={`h-4 w-4 ${isFavorited ? 'fill-red-500 text-red-500' : ''}`}
            />
        </button>
    );
}
