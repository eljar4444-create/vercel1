'use client';

import { useTranslations } from 'next-intl';

export function UserForm({
    name,
    setName,
    phone,
    setPhone,
    email,
    setEmail,
    comment,
    setComment,
}: {
    name: string; setName: (v: string) => void;
    phone: string; setPhone: (v: string) => void;
    email: string; setEmail: (v: string) => void;
    comment: string; setComment: (v: string) => void;
}) {
    const t = useTranslations('booking');
    const inputClass =
        'w-full h-11 bg-white border border-booking-border rounded-lg px-3 text-sm text-booking-textMain placeholder:text-booking-textMuted/70 outline-none transition-colors focus:border-booking-primary';

    return (
        <section className="mb-10 lg:mb-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-booking-textMuted mb-4">
                {t('form.title')}
            </h2>
            <div className="rounded-2xl border border-booking-border bg-white p-5 sm:p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-booking-textMain">{t('form.name')}</label>
                        <input
                            type="text"
                            placeholder={t('form.namePlaceholder')}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className={inputClass}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-booking-textMain">{t('form.phone')}</label>
                        <input
                            type="tel"
                            placeholder="+49 (999) 000-00-00"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className={inputClass}
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-booking-textMain">
                        {t('form.email')} <span className="text-red-400">*</span>
                    </label>
                    <input
                        type="email"
                        placeholder="alexandra@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={inputClass}
                    />
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-booking-textMain">
                        {t('form.comment')} <span className="font-normal text-booking-textMuted">{t('form.optional')}</span>
                    </label>
                    <textarea
                        placeholder={t('form.commentPlaceholder')}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="w-full min-h-[96px] bg-white border border-booking-border rounded-lg p-3 text-sm text-booking-textMain placeholder:text-booking-textMuted/70 outline-none transition-colors focus:border-booking-primary resize-vertical"
                    />
                </div>
            </div>
        </section>
    );
}
