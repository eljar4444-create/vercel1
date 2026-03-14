import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { getOnboardingCategories } from '@/app/actions/onboardingCategories';
import { MasterOnboardingWizard } from '@/components/onboarding/MasterOnboardingWizard';
import { BEAUTY_SERVICE_TITLES } from '@/lib/constants/services-taxonomy';

export const dynamic = 'force-dynamic';

type OnboardingPageProps = {
    searchParams?: {
        type?: string | string[];
    };
};

export default async function OnboardingPage({ searchParams }: OnboardingPageProps) {
    const typeParamRaw = searchParams?.type;
    const typeParam = Array.isArray(typeParamRaw) ? typeParamRaw[0] : typeParamRaw;
    const flowType = typeParam === 'SALON' ? 'SALON' : typeParam === 'INDIVIDUAL' ? 'INDIVIDUAL' : null;

    if (!flowType) {
        redirect('/become-pro');
    }

    const session = await auth();

    if (!session?.user?.id || !session.user.email) {
        redirect('/auth/login');
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            role: true,
            providerType: true,
            name: true,
        },
    });

    if (!user || user.role === 'ADMIN') {
        redirect('/');
    }

    const profile = await prisma.profile.findFirst({
        where: {
            OR: [
                { user_id: session.user.id },
                { user_email: session.user.email },
            ],
        },
        select: {
            id: true,
            name: true,
            bio: true,
            city: true,
            address: true,
            provider_type: true,
            category_id: true,
            image_url: true,
            schedule: true,
            services: {
                select: {
                    id: true,
                },
                take: 1,
            },
        },
    });

    const onboardingAlreadyCompleted = Boolean(
        profile &&
            (profile.services.length > 0 || profile.schedule !== null || Boolean(profile.image_url))
    );

    if (profile && onboardingAlreadyCompleted) {
        redirect(`/dashboard/${profile.id}`);
    }

    const categories = await getOnboardingCategories();
    const serviceStats = await prisma.service.groupBy({
        by: ['title'],
        where: {
            title: { in: BEAUTY_SERVICE_TITLES as string[] },
        },
        _avg: {
            price: true,
            duration_min: true,
        },
    });

    const serviceDefaults = serviceStats.reduce<Record<string, { price: number; duration: number }>>((acc, item) => {
        const avgPrice = item._avg.price != null ? Number(item._avg.price) : 0;
        const avgDuration = item._avg.duration_min != null ? Number(item._avg.duration_min) : 0;
        acc[item.title] = {
            price: avgPrice > 0 ? Number(avgPrice.toFixed(2)) : 0,
            duration: avgDuration > 0 ? Math.round(avgDuration) : 0,
        };
        return acc;
    }, {});

    return (
        <MasterOnboardingWizard
            userName={user.name ?? session.user.name ?? ''}
            flowType={flowType}
            categories={categories}
            serviceDefaults={serviceDefaults}
            initialProfile={profile ? {
                id: profile.id,
                name: profile.name,
                bio: profile.bio,
                city: profile.city,
                address: profile.address,
                providerType: profile.provider_type,
                categoryId: profile.category_id,
                languages: [],
                imageUrl: profile.image_url,
            } : null}
        />
    );
}
