import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { LegalSetupForm } from './Form';
import { getTranslations } from 'next-intl/server';

export default async function LegalSetupPage() {
    const t = await getTranslations('dashboard.provider.legalSetup');
    const session = await auth();
    if (!session?.user?.id) redirect('/auth/login');

    const profile = await prisma.profile.findFirst({
        where: { user_id: session.user.id },
        select: { 
            id: true, 
            onboardingCompleted: true, 
            user: {
                select: {
                    legalEntityType: true, 
                    legalName: true, 
                    taxId: true, 
                    vatId: true
                }
            }
        }
    });

    if (!profile) redirect('/onboarding');
    if (profile.onboardingCompleted) redirect('/dashboard');

    return (
        <div className="container max-w-2xl py-12 mx-auto mt-12 px-4">
            <h1 className="text-3xl font-bold mb-4">{t('title')}</h1>
            <p className="text-muted-foreground mb-8">
                {t('subtitle')}
            </p>
            <div className="bg-white border rounded-xl p-6 shadow-sm">
                <LegalSetupForm 
                    profileId={profile.id} 
                    initialData={{
                        legalEntityType: profile.user?.legalEntityType || 'individual',
                        legalName: profile.user?.legalName || '',
                        taxId: profile.user?.taxId || '',
                        vatId: profile.user?.vatId || ''
                    }} 
                />
            </div>
        </div>
    );
}
