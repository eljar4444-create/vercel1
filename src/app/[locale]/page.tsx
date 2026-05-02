import prisma from '@/lib/prisma';
import HomeHeroV2 from '@/components/homepage/HomeHeroV2';
import SearchBar from '@/components/homepage/SearchBar';
import CategoryNav from '@/components/homepage/CategoryNav';
import MasterGallery from '@/components/homepage/MasterGallery';
import HowItWorks from '@/components/homepage/HowItWorks';
import JealousyCard from '@/components/homepage/JealousyCard';
import ManifestoBand from '@/components/homepage/ManifestoBand';
import HomepageFooter from '@/components/homepage/Footer';
import { getFeaturedMasters } from '@/lib/homepage/getFeaturedMasters';
import type { Metadata } from 'next';
import { localizedAlternates, resolveLocale } from '@/i18n/canonical';
import { localizeCategoryName } from '@/lib/localized';

export const revalidate = 3600;

export async function generateMetadata({
    params,
}: {
    params: { locale: string };
}): Promise<Metadata> {
    return {
        alternates: localizedAlternates(resolveLocale(params.locale), '/'),
    };
}

export default async function HomePage({
    params,
}: {
    params: { locale: string };
}) {
    const locale = resolveLocale(params.locale);
    let categories: { id: number; name: string; slug: string; icon: string | null; translations: { locale: string; name: string }[] }[] = [];
    try {
        categories = await prisma.category.findMany({
            select: {
                id: true,
                name: true,
                slug: true,
                icon: true,
                translations: { select: { locale: true, name: true } },
            },
        });
    } catch (e) {
        console.warn('[HomePage] Could not load categories (DB unreachable?):', e);
    }

    const featuredMasters = await getFeaturedMasters(8, locale);

    const searchCategories = categories.map(c => ({
        id: String(c.id),
        name: localizeCategoryName(c, locale),
        slug: c.slug,
        image: c.icon,
    }));

    return (
        <div className="min-h-screen bg-[#F5F2ED]">
            <HomeHeroV2>
                <div className="w-full mt-12 md:mt-16 relative z-20">
                    <SearchBar categories={searchCategories} />
                </div>
            </HomeHeroV2>

            <div id="services" className="scroll-mt-24">
                <CategoryNav />
            </div>

            <div id="masters" className="scroll-mt-46">
                <MasterGallery initialMasters={featuredMasters} />
            </div>

            <HowItWorks />

            <JealousyCard />

            <ManifestoBand />

            <HomepageFooter />

        </div>
    );
}
