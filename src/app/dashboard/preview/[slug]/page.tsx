import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { auth } from '@/auth';
import { fetchProfileForView, PublicProfileView } from '@/lib/profileView';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: 'Предпросмотр профиля | Svoi.de',
    robots: { index: false, follow: false },
};

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
        profile.user_id === session.user.id ||
        (session.user.email ? profile.user_email === session.user.email : false);

    if (!isOwner) notFound();

    return <PublicProfileView profile={profile} isPreview />;
}
