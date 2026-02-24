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

    // Check if user already completed onboarding
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { onboardingCompleted: true, providerType: true, name: true },
    });

    if (user?.onboardingCompleted) {
        redirect('/provider/onboarding');
    }

    // Read provider type from onboarding cookie (set during auth)
    const cookieStore = await cookies();
    const cookieType = cookieStore.get('onboarding_type')?.value;

    // Map cookie value to ProviderType
    let providerType = 'INDIVIDUAL';
    if (cookieType === 'SALON') providerType = 'SALON';

    return (
        <OnboardingForm
            providerType={providerType}
            userName={user?.name ?? session.user.name ?? null}
        />
    );
}
