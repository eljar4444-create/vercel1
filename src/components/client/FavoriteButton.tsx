'use client';

import { useOptimistic, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Heart } from 'lucide-react';
import { toggleFavorite } from '@/app/actions/favorites';
import toast from 'react-hot-toast';

interface FavoriteButtonProps {
    providerProfileId: number;
    initialIsFavorited: boolean;
    variant?: 'card' | 'list';
    onToggle?: (isFavorited: boolean) => void;
}

export function FavoriteButton({
    providerProfileId,
    initialIsFavorited,
    variant = 'card',
    onToggle,
}: FavoriteButtonProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [optimisticFavorited, addOptimistic] = useOptimistic(
        initialIsFavorited,
        (state) => !state
    );

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isPending) return;
        addOptimistic(undefined);
        startTransition(async () => {
            const result = await toggleFavorite(providerProfileId);
            if (!result.success) {
                toast.error(result.error ?? 'Ошибка');
                throw new Error(result.error);
            }
            onToggle?.(result.isFavorited);
            if (result.isFavorited) toast.success('Добавлено в избранное');
            else {
                toast.success('Удалено из избранного');
                if (variant === 'list') router.refresh();
            }
        });
    };

    if (variant === 'list') {
        return (
            <button
                type="button"
                onClick={handleClick}
                disabled={isPending}
                aria-label={optimisticFavorited ? 'Удалить из избранного' : 'Добавить в избранное'}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
            >
                <Heart
                    className={`h-4 w-4 ${optimisticFavorited ? 'fill-red-500 text-red-500' : ''}`}
                />
            </button>
        );
    }

    return (
        <button
            type="button"
            onClick={handleClick}
            disabled={isPending}
            aria-label={optimisticFavorited ? 'Удалить из избранного' : 'В избранное'}
            className="absolute top-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-500 shadow-sm backdrop-blur transition hover:bg-white hover:text-slate-700 disabled:opacity-50"
        >
            <Heart
                className={`h-4 w-4 ${optimisticFavorited ? 'fill-red-500 text-red-500' : ''}`}
            />
        </button>
    );
}
