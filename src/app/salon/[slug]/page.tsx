import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { fetchProfileForView, PublicProfileView } from '@/lib/profileView';

export const revalidate = 3600;

export async function generateMetadata({
    params,
}: {
    params: { slug: string };
}): Promise<Metadata> {
    const profile = await fetchProfileForView(params.slug, { includeDraft: false });
    if (!profile) {
        return { title: 'Профиль не найден | Svoi.de' };
    }

    const topService =
        profile.services.length > 0
            ? profile.services[0].title
            : profile.category?.name || 'Мастер красоты';
    const title = `${profile.name} — ${topService} в ${profile.city} | Svoi.de`;
    const description = profile.bio
        ? profile.bio.slice(0, 150).trim() + (profile.bio.length > 150 ? '…' : '')
        : `${profile.name} — ${topService} в ${profile.city}. Онлайн-запись через Svoi.de.`;

    const ogImages = [profile.image_url, ...(profile.gallery ?? [])]
        .filter((url): url is string => typeof url === 'string' && url.trim().length > 0)
        .slice(0, 4);

    return {
        title,
        description,
        alternates: {
            canonical: `/salon/${profile.slug}`,
        },
        openGraph: {
            title,
            description,
            url: `/salon/${profile.slug}`,
            ...(ogImages.length > 0 && { images: ogImages }),
        },
    };
}

export default async function SalonProfilePage({
    params,
}: {
    params: { slug: string };
}) {
    const profile = await fetchProfileForView(params.slug, { includeDraft: false });
    if (!profile) notFound();

    return <PublicProfileView profile={profile} />;
}
