'use client';

import toast from 'react-hot-toast';
import { Link2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface CopyProfileLinkButtonProps {
    slug: string;
}

export function CopyProfileLinkButton({ slug }: CopyProfileLinkButtonProps) {
    const t = useTranslations('dashboard.provider.copyProfile');
    const handleCopyLink = async () => {
        const profileUrl = `${window.location.origin}/salon/${slug}`;
        try {
            await navigator.clipboard.writeText(profileUrl);
            toast.success(t('success'));
        } catch {
            toast.error(t('error'));
        }
    };

    return (
        <button
            type="button"
            onClick={handleCopyLink}
            aria-label={t('aria')}
            title={t('title')}
            className="flex items-center justify-center p-2.5 border border-gray-300 rounded-full hover:border-gray-900 hover:bg-gray-50 transition-colors bg-transparent text-gray-700"
        >
            <Link2 className="h-4 w-4" />
        </button>
    );
}
