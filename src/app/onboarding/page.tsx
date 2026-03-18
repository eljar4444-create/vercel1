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
    const splitStreetAndHouse = (address: string | null | undefined) => {
        const value = (address || '').trim();
        if (!value) {
            return { street: '', houseNumber: '' };
        }

        const match = value.match(/^(.*?)(?:\s+(\d+[a-zA-Z]?(?:[/-]\d+[a-zA-Z]?)?))$/);
        if (!match) {
            return { street: value, houseNumber: '' };
        }

        return {
            street: match[1]?.trim() || value,
            houseNumber: match[2]?.trim() || '',
        };
    };

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
            attributes: true,
            languages: true,
            onboardingStep: true,
            status: true,
            latitude: true,
            longitude: true,
            providesInStudio: true,
            providesOutcall: true,
            outcallRadiusKm: true,
        },
    });

    if (profile?.status && profile.status !== 'DRAFT') {
        redirect('/dashboard');
    }

    const rawDraftState =
        profile?.attributes &&
        typeof profile.attributes === 'object' &&
        !Array.isArray(profile.attributes)
            ? (profile.attributes as Record<string, unknown>).onboardingDraft
            : null;
    const draftState =
        rawDraftState && typeof rawDraftState === 'object' && !Array.isArray(rawDraftState)
            ? (rawDraftState as Record<string, unknown>)
            : {};
    const workLocations = Array.isArray(draftState.workLocations)
        ? draftState.workLocations
            .filter((value): value is Record<string, unknown> => Boolean(value) && typeof value === 'object')
            .map((location) => {
                const rawAddress = String(location.address || '');
                const parts = splitStreetAndHouse(rawAddress);
                return {
                    placeName: String(location.placeName || ''),
                    street: String(location.street || parts.street || ''),
                    houseNumber: String(location.houseNumber || parts.houseNumber || ''),
                    address: rawAddress,
                    zipCode: String(location.zipCode || ''),
                    city: String(location.city || ''),
                    cityLatitude: Number.isFinite(Number(location.cityLatitude)) ? Number(location.cityLatitude) : null,
                    cityLongitude: Number.isFinite(Number(location.cityLongitude)) ? Number(location.cityLongitude) : null,
                    latitude: Number.isFinite(Number(location.latitude)) ? Number(location.latitude) : null,
                    longitude: Number.isFinite(Number(location.longitude)) ? Number(location.longitude) : null,
                    hideExactAddress: Boolean(location.hideExactAddress),
                };
            })
        : [];
    const audiences = Array.isArray(draftState.audiences)
        ? draftState.audiences
            .map((value) => String(value))
            .filter((value): value is 'women' | 'men' | 'kids' =>
                value === 'women' || value === 'men' || value === 'kids'
            )
        : [];
    const managerName = typeof draftState.managerName === 'string' ? draftState.managerName : '';
    const zipCode = typeof draftState.zipCode === 'string' ? draftState.zipCode : '';

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
                languages: profile.languages,
                imageUrl: profile.image_url,
                onboardingStep: profile.onboardingStep,
                providesInStudio: profile.providesInStudio,
                providesOutcall: profile.providesOutcall,
                outcallRadiusKm: profile.outcallRadiusKm,
                latitude: profile.latitude,
                longitude: profile.longitude,
                workLocations,
                audiences,
                managerName,
                zipCode,
            } : null}
        />
    );
}
