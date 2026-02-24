import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { OnboardingForm } from '@/components/OnboardingForm';

export const dynamic = 'force-dynamic';

export default async function OnboardingPage() {
    const session = await auth();

    if (!session?.user?.id) {
        redirect('/auth/login');
    }

    // Fetch fresh user from DB
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            role: true,
            onboardingCompleted: true,
            providerType: true,
            name: true,
        },
    });

    // Guard: clients should never see this page
    if (!user || user.role === 'CLIENT') {
        redirect('/');
    }

    // Guard: already completed onboarding → go to provider dashboard
    if (user.onboardingCompleted) {
        // Find their profile to redirect to the correct dashboard
        const profile = await prisma.profile.findUnique({
            where: { user_id: session.user.id },
            select: { id: true },
        });

        if (profile) {
            redirect(`/dashboard/${profile.id}`);
        }

        // If no profile yet, send to provider onboarding (profile creation)
        redirect('/provider/onboarding');
    }

    // Read provider type from onboarding cookie (set during auth)
    const cookieStore = await cookies();
    const cookieType = cookieStore.get('onboarding_type')?.value;

    // Prefer cookie value, fall back to DB value
    let providerType = user.providerType || 'INDIVIDUAL';
    if (cookieType === 'SALON') providerType = 'SALON';
    else if (cookieType === 'INDIVIDUAL') providerType = 'INDIVIDUAL';

    return (
        <OnboardingForm
            providerType={providerType}
            userName={user.name ?? session.user.name ?? null}
        />
    );
}
