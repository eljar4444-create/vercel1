import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { fetchProfileForView, PublicProfileView } from '@/lib/profileView';
import { localizedAlternates, pathForLocale, resolveLocale } from '@/i18n/canonical';
import { localizeCategoryName, localizeProfileBio, localizeService } from '@/lib/localized';

export const revalidate = 3600;

export async function generateMetadata({
    params,
}: {
    params: { locale: string; slug: string };
}): Promise<Metadata> {
    const profile = await fetchProfileForView(params.slug, { includeDraft: false });
    if (!profile) {
        return { title: 'Профиль не найден | Svoi.de' };
    }

    const locale = resolveLocale(params.locale);
    const services = profile.services.map((service) => localizeService(service, locale));
    const localizedCategoryName = profile.category ? localizeCategoryName(profile.category, locale) : null;
    const localizedBio = localizeProfileBio(profile, locale);
    const topService =
        services.length > 0
            ? services[0].title
            : localizedCategoryName || 'Мастер красоты';
    const title = `${profile.name} — ${topService} в ${profile.city} | Svoi.de`;
    const description = localizedBio
        ? localizedBio.slice(0, 150).trim() + (localizedBio.length > 150 ? '…' : '')
        : `${profile.name} — ${topService} в ${profile.city}. Онлайн-запись через Svoi.de.`;

    const ogImages = [profile.image_url, ...(profile.gallery ?? [])]
        .filter((url): url is string => typeof url === 'string' && url.trim().length > 0)
        .slice(0, 4);

    const path = `/salon/${profile.slug}`;

    return {
        title,
        description,
        alternates: localizedAlternates(locale, path),
        openGraph: {
            title,
            description,
            url: pathForLocale(locale, path),
            ...(ogImages.length > 0 && { images: ogImages }),
        },
    };
}

export default async function SalonProfilePage({
    params,
}: {
    params: { locale: string; slug: string };
}) {
    const profile = await fetchProfileForView(params.slug, { includeDraft: false });
    if (!profile) notFound();

    return <PublicProfileView profile={profile} />;
}
