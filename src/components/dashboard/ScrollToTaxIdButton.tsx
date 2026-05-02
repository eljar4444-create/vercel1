'use client';

import { useTranslations } from 'next-intl';

export function ScrollToTaxIdButton() {
    const t = useTranslations('dashboard.provider.tax');
    const handleClick = () => {
        const el = document.getElementById('steuernummer-input');
        if (!el) return;
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        window.setTimeout(() => {
            (el as HTMLInputElement).focus();
        }, 400);
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            className="bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-700 transition-colors"
        >
            {t('enterNumber')}
        </button>
    );
}
