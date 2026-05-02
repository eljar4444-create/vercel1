'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Info, AlertCircle, Sparkles, Loader2 } from 'lucide-react';
import { verifyAndPublishProfile } from '@/app/actions/publishProfile';
import { useTranslations } from 'next-intl';

type PendingReviewNoticeProps = {
    profileId: number;
    profileStatus: string;
};

export function PendingReviewNotice({ profileId, profileStatus }: PendingReviewNoticeProps) {
    const t = useTranslations('dashboard.provider.publishNotice');
    const isPendingReview = profileStatus === 'PENDING_REVIEW' || profileStatus === 'PENDING' || profileStatus === 'DRAFT';
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isPendingReview) {
        return null; // Profile is published or suspended
    }

    const handlePublish = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await verifyAndPublishProfile();
            if (!result.success) {
                setError(result.error || t('publishError'));
            }
        } catch (e) {
            setError(t('serverError'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mb-6 overflow-hidden rounded-2xl border border-sky-200 bg-gradient-to-r from-sky-50 via-cyan-50 to-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-4">
                    <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-700">
                        <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-sky-950">
                            {t('title')}
                        </h3>
                        <p className="mt-1 text-sm leading-relaxed text-sky-800 max-w-2xl">
                            {t.rich('body', {
                                photo: (chunks) => <strong>{chunks}</strong>,
                                service: (chunks) => <strong>{chunks}</strong>,
                            })}
                        </p>
                        
                        {error && (
                            <div className="mt-3 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-800 border border-red-100">
                                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                                <span>{error}</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="shrink-0 pt-2 sm:pt-0">
                    <Button 
                        onClick={handlePublish} 
                        disabled={loading}
                        className="w-full sm:w-auto bg-sky-600 text-white hover:bg-sky-700 shadow-sm"
                    >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {loading ? t('checking') : t('publish')}
                    </Button>
                </div>
            </div>
        </div>
    );
}
