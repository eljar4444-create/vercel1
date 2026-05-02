import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { BookingStandalone } from '@/components/booking-ui/BookingStandalone';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { resolveLocale } from '@/i18n/canonical';
import { localizeService } from '@/lib/localized';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { locale: string; slug: string } }): Promise<Metadata> {
    const locale = resolveLocale(params.locale);
    const t = await getTranslations({ locale, namespace: 'booking.meta' });
    const profile = await prisma.profile.findFirst({
        where: { slug: params.slug, status: 'PUBLISHED' },
        select: { name: true, city: true }
    });
    
    if (!profile) return { title: t('notFound'), robots: { index: false } };

    return {
        title: t('title', { name: profile.name }),
        description: t('description', { city: profile.city }),
        robots: { index: false },
    };
}

export default async function BookingPage({
    params,
    searchParams
}: {
    params: { locale: string; slug: string };
    searchParams: { serviceId?: string; staffId?: string };
}) {
    const locale = resolveLocale(params.locale);
    const session = await auth();
    
    // 1. Fetch Profile
    const profile = await prisma.profile.findFirst({
        where: { slug: params.slug, status: 'PUBLISHED' },
        select: {
            id: true,
            slug: true,
            name: true,
            staff: {
                select: { id: true, name: true, avatarUrl: true }
            }
        }
    });

    if (!profile) notFound();

    // 2. Fetch specific service if provided in params
    let selectedService = null;
    if (searchParams.serviceId) {
        const sId = parseInt(searchParams.serviceId, 10);
        if (!isNaN(sId)) {
            const svc = await prisma.service.findFirst({
                where: { id: sId, profile_id: profile.id },
                select: {
                    id: true,
                    title: true,
                    price: true,
                    duration_min: true,
                    images: true,
                    translations: { select: { locale: true, title: true, description: true } },
                }
            });
            
            if (svc) {
                const localizedService = localizeService(svc, locale);
                selectedService = {
                    id: localizedService.id,
                    title: localizedService.title,
                    price: String(localizedService.price),
                    duration_min: localizedService.duration_min,
                    image: localizedService.images && localizedService.images.length > 0 ? localizedService.images[0] : null
                };
            }
        }
    }

    return (
        <div className="min-h-screen bg-booking-bg selection:bg-booking-primary selection:text-white pb-20">
            <BookingStandalone 
                profile={profile} 
                service={selectedService} 
                sessionUser={session?.user || null}
                initialStaffId={searchParams.staffId || null}
            />
        </div>
    );
}
