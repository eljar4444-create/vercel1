import { Suspense } from 'react';
import prisma from '@/lib/prisma';
import HomeHeroV2 from '@/components/homepage/HomeHeroV2';
import SearchBar from '@/components/homepage/SearchBar';
import CategoryNav from '@/components/homepage/CategoryNav';
import MasterGallery from '@/components/homepage/MasterGallery';
import HowItWorks from '@/components/homepage/HowItWorks';
import ManifestoBand from '@/components/homepage/ManifestoBand';
import HomepageFooter from '@/components/homepage/Footer';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
    const categories = await prisma.category.findMany({
        select: { id: true, name: true, slug: true, icon: true },
    });

    const searchCategories = categories.map(c => ({
        id: String(c.id),
        name: c.name,
        slug: c.slug,
        image: c.icon,
    }));

    return (
        <div className="min-h-screen bg-booking-bg">
            <HomeHeroV2>
                <div className="w-full mt-12 md:mt-16 relative z-20">
                    <SearchBar categories={searchCategories} />
                </div>
            </HomeHeroV2>

            <CategoryNav />

            <Suspense fallback={<div className="h-96 w-full animate-pulse bg-booking-bg" />}>
                <MasterGallery />
            </Suspense>

            <HowItWorks />

            <ManifestoBand />

            <HomepageFooter />
        </div>
    );
}
