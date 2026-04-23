'use client';

import toast from 'react-hot-toast';
import { Link2 } from 'lucide-react';

interface CopyProfileLinkButtonProps {
    slug: string;
}

export function CopyProfileLinkButton({ slug }: CopyProfileLinkButtonProps) {
    const handleCopyLink = async () => {
        const profileUrl = `${window.location.origin}/salon/${slug}`;
        try {
            await navigator.clipboard.writeText(profileUrl);
            toast.success('Ссылка на профиль скопирована!');
        } catch {
            toast.error('Не удалось скопировать ссылку');
        }
    };

    return (
        <button
            type="button"
            onClick={handleCopyLink}
            aria-label="Скопировать ссылку на профиль"
            title="Скопировать ссылку"
            className="flex items-center justify-center p-2.5 border border-gray-300 rounded-full hover:border-gray-900 hover:bg-gray-50 transition-colors bg-transparent text-gray-700"
        >
            <Link2 className="h-4 w-4" />
        </button>
    );
}
