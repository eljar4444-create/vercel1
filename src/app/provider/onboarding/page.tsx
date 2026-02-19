import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { ProviderOnboardingForm } from '@/components/provider/ProviderOnboardingForm';

export const dynamic = 'force-dynamic';

export default async function ProviderOnboardingPage() {
    const session = await auth();

    if (!session?.user?.id || !session.user.email) {
        redirect('/auth/login');
    }

    if (session.user.role !== 'PROVIDER' && session.user.role !== 'ADMIN') {
        redirect('/');
    }

    const existingProfile = await prisma.profile.findFirst({
        where: {
            OR: [
                { user_id: session.user.id },
                { user_email: session.user.email },
            ],
        },
        select: { id: true },
    });

    if (existingProfile) {
        redirect(`/dashboard/${existingProfile.id}`);
    }

    const categories = await prisma.category.findMany({
        select: { id: true, name: true, icon: true },
        orderBy: { name: 'asc' },
    });

    return (
        <section className="min-h-screen bg-gray-50 px-4 py-8">
            <div className="mx-auto w-full max-w-lg">
                <div className="mb-5 rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 p-5 text-white shadow-lg">
                    <p className="text-xs uppercase tracking-[0.18em] text-gray-300">Provider onboarding</p>
                    <h1 className="mt-2 text-2xl font-bold">Создание кабинета мастера</h1>
                    <p className="mt-2 text-sm text-gray-300">
                        Заполните базовые данные, чтобы открыть дашборд и начать прием заявок.
                    </p>
                </div>

                <ProviderOnboardingForm
                    categories={categories}
                    email={session.user.email}
                    defaultName={session.user.name}
                />
            </div>
        </section>
    );
}
