export const revalidate = 3600;

import prisma from '@/lib/prisma';
import Link from 'next/link';
import { getCityFilterVariants } from '@/constants/searchSuggestions';
import { GERMAN_CITIES } from '@/constants/germanCities';
import { SearchResultListItem } from '@/components/search/SearchResultListItem';
import { deslugify, slugify } from '@/lib/slugify';
import type { Metadata } from 'next';
import ScrollReveal from '@/components/ScrollReveal';
import { notFound } from 'next/navigation';
import { getBatchedQuickSlots } from '@/app/actions/getQuickSlots';
import { localizedAlternates, absoluteUrlForLocale, pathForLocale, resolveLocale } from '@/i18n/canonical';
import { getTranslations } from 'next-intl/server';
import { localizeCategoryName, localizeService } from '@/lib/localized';

/**
 * Resolve slug back to a pretty German city name from GERMAN_CITIES.
 */
function resolveCityName(slug: string): string {
    const decoded = decodeURIComponent(slug).toLowerCase();
    const slugForm = slugify(decoded);

    if (slugForm) {
        for (const entry of GERMAN_CITIES) {
            const display = entry.data?.display_name?.split(',')?.[0]?.trim() || '';
            if (display && slugify(display) === slugForm) return display;
            for (const name of entry.names) {
                const nameSlug = slugify(name);
                if (nameSlug && nameSlug === slugForm) {
                    return display || name.charAt(0).toUpperCase() + name.slice(1);
                }
            }
        }
    }

    return deslugify(slug);
}

/**
 * Resolve category slug to a display name.
 * First tries DB, then falls back to deslugify.
 */
async function resolveCategoryName(slug: string, locale: string): Promise<string> {
    const decoded = decodeURIComponent(slug);

    try {
        const category = await prisma.category.findUnique({
            where: { slug: decoded },
            select: {
                name: true,
                translations: { select: { locale: true, name: true } },
            },
        });
        if (category) return localizeCategoryName(category, locale);
    } catch {
        // DB not available, fallback
    }

    return deslugify(decoded);
}

function capitalize(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1);
}

export async function generateMetadata({
    params,
}: {
    params: { locale: string; city: string; category: string };
}): Promise<Metadata> {
    const cityName = resolveCityName(params.city);
    const locale = resolveLocale(params.locale);
    const categoryName = capitalize(await resolveCategoryName(params.category, locale));
    const t = await getTranslations({ locale, namespace: 'cityCategory' });

    return {
        title: t('metaTitle', { category: categoryName, city: cityName }),
        description: t('metaDescription', { category: categoryName, city: cityName }),
        alternates: localizedAlternates(locale, `/${params.city}/${params.category}`),
    };
}

export default async function CityCategoryPage({
    params,
}: {
    params: { locale: string; city: string; category: string };
}) {
    const cityName = resolveCityName(params.city);
    const categorySlug = decodeURIComponent(params.category);
    const cityVariants = getCityFilterVariants(cityName);
    const locale = resolveLocale(params.locale);
    const categoryName = capitalize(await resolveCategoryName(params.category, locale));
    const t = await getTranslations({ locale, namespace: 'cityCategory' });
    const tCity = await getTranslations({ locale, namespace: 'city' });
    const tCommon = await getTranslations({ locale, namespace: 'common' });

    // Build query conditions
    const andConditions: any[] = [
        { status: 'PUBLISHED' },
        { is_verified: true },
        { category: { slug: { not: 'health' } } },
        { user: { isBanned: false } }
    ];

    // City filter
    if (cityVariants.length > 0) {
        andConditions.push({
            OR: cityVariants.map((variant) => ({
                city: { contains: variant, mode: 'insensitive' },
            })),
        });
    }

    // Category filter: try matching by Category.slug OR by service title
    andConditions.push({
        OR: [
            { category: { slug: categorySlug } },
            {
                category: {
                    OR: [
                        { name: { contains: categoryName, mode: 'insensitive' } },
                        {
                            translations: {
                                some: { name: { contains: categoryName, mode: 'insensitive' } },
                            },
                        },
                    ],
                },
            },
            {
                services: {
                    some: {
                        OR: [
                            { title: { contains: categoryName, mode: 'insensitive' } },
                            { description: { contains: categoryName, mode: 'insensitive' } },
                            {
                                translations: {
                                    some: {
                                        OR: [
                                            { title: { contains: categoryName, mode: 'insensitive' } },
                                            { description: { contains: categoryName, mode: 'insensitive' } },
                                        ],
                                    },
                                },
                            },
                        ],
                    },
                },
            },
        ],
    });

    let profiles: any[] = [];
    let batchedSlots: Record<number, any> = {};
    try {
        profiles = await prisma.profile.findMany({
            where: { AND: andConditions },
            include: {
                category: { include: { translations: true } },
                services: { include: { translations: true } },
            },
            orderBy: { created_at: 'desc' },
            take: 50,
        });
        if (profiles.length > 0) {
            const profileIds = profiles.map((p) => p.id);
            batchedSlots = await getBatchedQuickSlots(profileIds);
        }
    } catch (e: any) {
        console.error('DB Error:', e);
    }

    if (profiles.length === 0) {
        notFound();
    }

    const breadcrumbJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: tCity('breadcrumb.home'), item: absoluteUrlForLocale(locale, '/') },
            { '@type': 'ListItem', position: 2, name: cityName, item: absoluteUrlForLocale(locale, `/${params.city}`) },
            { '@type': 'ListItem', position: 3, name: categoryName, item: absoluteUrlForLocale(locale, `/${params.city}/${params.category}`) },
        ],
    };

    const itemListJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        itemListElement: profiles.map((profile: any, i: number) => ({
            '@type': 'ListItem',
            position: i + 1,
            url: absoluteUrlForLocale(locale, `/salon/${profile.slug}`),
            name: profile.name,
        })),
    };

    return (
        <main className="min-h-screen">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
            />
            <div className="container mx-auto max-w-5xl px-4 py-8">
                <nav aria-label={tCommon('navigation')} className="mb-6 flex items-center gap-2 text-sm text-slate-500">
                    <Link href={pathForLocale(locale, '/')} className="transition hover:text-slate-800">{tCity('breadcrumb.home')}</Link>
                    <span>/</span>
                    <Link href={pathForLocale(locale, `/${params.city}`)} className="transition hover:text-slate-800">{cityName}</Link>
                    <span>/</span>
                    <span className="text-slate-700 font-medium">{categoryName}</span>
                </nav>

                <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                    {t('h1', { category: categoryName, city: cityName })}
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                    {profiles.length > 0 ? tCity('foundCount', { count: profiles.length }) : tCity('noneYet')}
                </p>

                <ScrollReveal className="mt-8">
                    {profiles.length > 0 ? (
                        <div className="flex flex-col gap-12">
                            {profiles.filter((p: any) => p.provider_type === 'SALON').length > 0 && (
                                <div>
                                    <h2 className="mb-6 text-xl font-bold text-slate-900 sm:text-2xl">{tCity('salons')}</h2>
                                    <div className="flex flex-col">
                                        {profiles
                                            .filter((p: any) => p.provider_type === 'SALON')
                                            .map((profile: any, index: number) => (
                                                <SearchResultListItem
                                                    key={profile.id}
                                                    profile={{
                                                        id: profile.id,
                                                        slug: profile.slug,
                                                        name: profile.name,
                                                        provider_type: profile.provider_type,
                                                        city: profile.city,
                                                        address: profile.address,
                                                        image_url: profile.image_url,
                                                        gallery: profile.gallery,
                                                        services: (profile.services || []).map((s: any) => {
                                                            const service = localizeService(s, locale);
                                                            return {
                                                                id: service.id,
                                                                title: service.title,
                                                                price: Number(service.price),
                                                                duration_min: service.duration_min,
                                                            };
                                                        }),
                                                    }}
                                                    prefetchedSlots={batchedSlots[profile.id] || null}
                                                    priority={index < 3}
                                                />
                                            ))}
                                    </div>
                                </div>
                            )}

                            {profiles.filter((p: any) => p.provider_type !== 'SALON').length > 0 && (
                                <div>
                                    <h2 className="mb-6 text-xl font-bold text-slate-900 sm:text-2xl">{tCity('privateMasters')}</h2>
                                    <div className="flex flex-col">
                                        {profiles
                                            .filter((p: any) => p.provider_type !== 'SALON')
                                            .map((profile: any, index: number) => (
                                                <SearchResultListItem
                                                    key={profile.id}
                                                    profile={{
                                                        id: profile.id,
                                                        slug: profile.slug,
                                                        name: profile.name,
                                                        provider_type: profile.provider_type,
                                                        city: profile.city,
                                                        address: profile.address,
                                                        image_url: profile.image_url,
                                                        gallery: profile.gallery,
                                                        services: (profile.services || []).map((s: any) => {
                                                            const service = localizeService(s, locale);
                                                            return {
                                                                id: service.id,
                                                                title: service.title,
                                                                price: Number(service.price),
                                                                duration_min: service.duration_min,
                                                            };
                                                        }),
                                                    }}
                                                    prefetchedSlots={batchedSlots[profile.id] || null}
                                                    priority={index < 3}
                                                />
                                            ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
                            <h2 className="text-lg font-semibold text-slate-900">{tCity('emptyTitle')}</h2>
                            <p className="mt-2 text-sm text-slate-500">
                                {t('emptyBody', { category: categoryName, city: cityName })}
                            </p>
                            <Link
                                href={pathForLocale(locale, `/${params.city}`)}
                                className="mt-5 inline-flex min-h-[44px] items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                            >
                                {t('allMastersInCity', { city: cityName })}
                            </Link>
                        </div>
                    )}
                </ScrollReveal>
            </div>
        </main>
    );
}
