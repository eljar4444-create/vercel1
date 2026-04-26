import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { BookingStandalone } from '@/components/booking-ui/BookingStandalone';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
    const profile = await prisma.profile.findFirst({
        where: { slug: params.slug, status: 'PUBLISHED' },
        select: { name: true, city: true }
    });
    
    if (!profile) return { title: 'Не найдено', robots: { index: false } };

    return {
        title: `Запись к ${profile.name} | Svoi.de`,
        description: `Оформление записи онлайн. ${profile.city}.`,
        robots: { index: false },
    };
}

export default async function BookingPage({
    params,
    searchParams
}: {
    params: { slug: string };
    searchParams: { serviceId?: string; staffId?: string };
}) {
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
                select: { id: true, title: true, price: true, duration_min: true, images: true }
            });
            
            if (svc) {
                selectedService = {
                    id: svc.id,
                    title: svc.title,
                    price: String(svc.price),
                    duration_min: svc.duration_min,
                    image: svc.images && svc.images.length > 0 ? svc.images[0] : null
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
