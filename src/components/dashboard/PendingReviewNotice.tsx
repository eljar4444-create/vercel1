'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Info, Sparkles, X } from 'lucide-react';

type PendingReviewNoticeProps = {
    profileId: number;
    profileStatus: string;
};

export function PendingReviewNotice({ profileId, profileStatus }: PendingReviewNoticeProps) {
    const isPendingReview = profileStatus === 'PENDING_REVIEW' || profileStatus === 'PENDING';
    const [isReady, setIsReady] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        if (!isPendingReview) {
            setIsReady(true);
            setIsModalOpen(false);
            return;
        }

        const storageKey = `provider-pending-welcome-seen:${profileId}`;
        const hasSeenWelcome = window.localStorage.getItem(storageKey) === 'true';
        setIsModalOpen(!hasSeenWelcome);
        setIsReady(true);
    }, [isPendingReview, profileId]);

    const handleClose = () => {
        window.localStorage.setItem(`provider-pending-welcome-seen:${profileId}`, 'true');
        setIsModalOpen(false);
    };

    if (!isPendingReview || !isReady) {
        return null;
    }

    return (
        <>
            <div className="mb-4 overflow-hidden rounded-2xl border border-sky-200 bg-gradient-to-r from-sky-50 via-cyan-50 to-white px-4 py-3 text-sm text-sky-950 shadow-sm">
                <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-700">
                        <Info className="h-4 w-4" />
                    </div>
                    <p className="leading-6">
                        ℹ️ Ваш профиль находится на проверке. Вы можете заполнять кабинет — данные появятся в поиске
                        после модерации.
                    </p>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm">
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="pending-provider-modal-title"
                        className="relative w-full max-w-xl rounded-3xl border border-sky-100 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.22)]"
                    >
                        <button
                            type="button"
                            onClick={handleClose}
                            aria-label="Закрыть уведомление"
                            className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                        >
                            <X className="h-4 w-4" />
                        </button>

                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
                            <Sparkles className="h-6 w-6" />
                        </div>
                        <h2
                            id="pending-provider-modal-title"
                            className="max-w-[28rem] text-2xl font-bold tracking-tight text-slate-900"
                        >
                            Ваша заявка обрабатывается! 🎉
                        </h2>
                        <p className="mt-3 text-sm leading-6 text-slate-600">
                            Обычно модерация занимает до 24 часов. Чтобы не терять время, вы можете уже сейчас
                            добавить свои услуги, загрузить портфолио и настроить график. Как только мы вас одобрим,
                            ваш профиль появится в поиске.
                        </p>
                        <div className="mt-6 flex justify-end">
                            <Button onClick={handleClose} className="bg-slate-900 text-white hover:bg-slate-800">
                                Понятно, иду настраивать
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
