import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

import {
    PassportVerificationCard, ServicePublicationCard, PublicProfileCard,
    ProfileStatsGrid, ServicesList, AddSpecialtyButton, ServiceItem
} from '@/components/provider/DashboardCards';
import prisma from '@/lib/prisma';

export default async function ProviderProfile() {
    const session = await auth();

    if (!session?.user?.email) {
        redirect('/auth/login');
    }

    // Strict role check might be too aggressive if they just signed up, 
    // but legacy code had it. We keep it or relax it? 
    // Let's relax it slightly or redirect to "become provider".
    // Actually, legacy code redirected to '/' if not provider.
    // We'll keep it simple: if no profile, redirect to become-provider.

    const user = await prisma.user.findUnique({
        where: { email: session.user.email }
    });

    if (!user) return redirect('/auth/login');

    // Fetch provider profile using new Profile model
    // We search by user_email
    const profile = await prisma.profile.findUnique({
        where: { user_email: user.email! },
        include: {
            services: {
                orderBy: { id: 'desc' }
            },
            category: true
        }
    });

    if (!profile) {
        // If they have PROVIDER role but no profile, maybe they need onboarding
        if (user.role === 'PROVIDER') {
            return redirect('/become-provider');
        }
        return redirect('/become-provider');
    }

    // Map new fields to legacy expected props
    const verificationStatus = profile.is_verified ? 'APPROVED' : 'IDLE';
    const address = profile.address || profile.city || '';

    // Bio is on User model in new schema
    const bio = user.bio || '';

    // Services mapping
    const services: ServiceItem[] = profile.services.map(s => ({
        id: s.id,
        title: s.title,
        description: s.description,
        price: s.price,
        categoryName: profile.category.name,
        status: 'APPROVED'
    }));

    // Count unique specialties? In new schema, profile has ONE category.
    // So specialties count is 1 if category exists.
    const specialtiesCount = profile.category ? 1 : 0;

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl pt-24">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-1">{profile.name}</h1>
                <p className="text-red-500 font-bold flex items-center justify-center gap-2">
                    {verificationStatus !== 'APPROVED' && (
                        <>
                            <span className="bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]">!</span>
                            Профиль не прошёл проверку
                        </>
                    )}
                    {verificationStatus === 'APPROVED' && (
                        <span className="text-green-600">Профиль подтвержден</span>
                    )}
                </p>
                <div className="mt-4">
                    <Link href="/provider/profile/edit" className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200">
                        Редактировать профиль
                    </Link>
                </div>
            </div>

            <PassportVerificationCard status={verificationStatus} />

            <ServicePublicationCard />

            <PublicProfileCard />

            <ProfileStatsGrid
                hasPhoto={!!profile.image_url} // Use profile image or user image? Profile has image_url
                hasAddress={!!address}
                bioLength={bio.length}
                specialtiesCount={specialtiesCount}
            />

            <ServicesList services={services} />

            <AddSpecialtyButton />
        </div>
    );
}
