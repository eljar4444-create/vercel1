import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

type LegacyDashboardPageProps = {
    searchParams?: {
        section?: string | string[];
    };
};

function parseSection(searchParams?: LegacyDashboardPageProps['searchParams']) {
    const sectionRaw = searchParams?.section;
    const section = Array.isArray(sectionRaw) ? sectionRaw[0] : sectionRaw;

    if (
        section === 'bookings' ||
        section === 'analytics' ||
        section === 'services' ||
        section === 'schedule' ||
        section === 'profile'
    ) {
        return section;
    }

    return null;
}

export default async function LegacyDashboardPage({ searchParams }: LegacyDashboardPageProps) {
    const session = await auth();

    if (!session?.user?.id) {
        redirect('/auth/login');
    }

    const section = parseSection(searchParams);
    redirect(section ? `/dashboard?section=${section}` : '/dashboard');
}
