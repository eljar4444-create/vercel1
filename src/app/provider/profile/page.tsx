import { auth } from '@/auth';
import { redirect } from 'next/navigation';

import {
    PassportVerificationCard, ServicePublicationCard, PublicProfileCard,
    ProfileStatsGrid, ServicesList, AddSpecialtyButton
} from '@/components/provider/DashboardCards';
import prisma from '@/lib/prisma';

export default async function ProviderProfile() {
    const session = await auth();

    if (!session?.user) {
        redirect('/auth/login');
    }

    if (session.user.role !== 'PROVIDER') {
        redirect('/'); // Or create a provider profile if not exists? But role check is strict here.
    }

    const sessionUser = session.user;

    const user = await prisma.user.findUnique({
        where: { id: sessionUser.id }
    });

    if (!user) return redirect('/auth/login');

    // Fetch provider profile for status and services
    const providerProfile = await prisma.providerProfile.findUnique({
        where: { userId: user.id },
        select: {
            verificationStatus: true,
            bio: true,
            address: true,
            city: true,
            services: {
                orderBy: { createdAt: 'desc' },
                where: {
                    status: {
                        not: 'PAYMENT_PENDING'
                    }
                },
                include: { category: true }
            }
        }
    });

    const verificationStatus = providerProfile?.verificationStatus || 'IDLE';
    const services = providerProfile?.services || [];
    const specialtiesCount = new Set(services.map(s => s.category?.name).filter(Boolean)).size;

    return (
        <>
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-1">{user.name}</h1>
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
                    <a href="/provider/profile/edit" className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200">
                        Редактировать профиль
                    </a>
                </div>
            </div>

            <PassportVerificationCard status={verificationStatus} />

            <ServicePublicationCard />

            <PublicProfileCard />

            <ProfileStatsGrid
                hasPhoto={!!user.image}
                hasAddress={!!providerProfile?.address || !!providerProfile?.city}
                bioLength={providerProfile?.bio?.length || 0}
                specialtiesCount={specialtiesCount}
            />

            <ServicesList services={services} />

            <AddSpecialtyButton />
        </>
    );
}
