import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { auth } from '@/auth';
import { fetchProfileForView, PublicProfileView } from '@/lib/profileView';
import { getTranslations } from 'next-intl/server';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations('dashboard.provider.preview');

    return {
        title: t('title'),
        robots: { index: false, follow: false },
    };
}

export default async function ProfilePreviewPage({
    params,
}: {
    params: { slug: string };
}) {
    const session = await auth();
    if (!session?.user?.id) {
        redirect(`/auth/login?next=/dashboard/preview/${params.slug}`);
    }

    const profile = await fetchProfileForView(params.slug, { includeDraft: true });
    if (!profile) notFound();

    const isOwner =
        session.user.role === 'ADMIN' ||
        profile.user_id === session.user.id;

    if (!isOwner) notFound();

    return <PublicProfileView profile={profile} isPreview />;
}
