'use client';

import { useTranslations } from 'next-intl';
import { SpecialistCard, type SpecialistCardProps } from './SpecialistCard';

export interface TeamSectionProps {
    specialists: SpecialistCardProps[];
}

export function TeamSection({ specialists }: TeamSectionProps) {
    const t = useTranslations('salon');
    if (specialists.length === 0) return null;

    return (
        <section className="py-8">
            <h2 className="font-serif text-2xl font-semibold text-booking-textMain mb-6 px-4 sm:px-6">
                {t('section.team')}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-4 sm:px-6">
                {specialists.map((spec) => (
                    <SpecialistCard key={spec.id} {...spec} />
                ))}
            </div>
        </section>
    );
}
