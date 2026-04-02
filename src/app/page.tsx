import { Suspense } from 'react';
import prisma from '@/lib/prisma';
import HomeHeroV2 from '@/components/homepage/HomeHeroV2';
import SearchBar from '@/components/homepage/SearchBar';
import CategoryNav from '@/components/homepage/CategoryNav';
import MasterGallery from '@/components/homepage/MasterGallery';
import HowItWorks from '@/components/homepage/HowItWorks';
import JealousyCard from '@/components/homepage/JealousyCard';
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
        <div className="min-h-screen bg-[#F5F2ED]">
            <HomeHeroV2>
                <div className="w-full mt-12 md:mt-16 relative z-20">
                    <SearchBar categories={searchCategories} />
                </div>
            </HomeHeroV2>

            <div id="services" className="scroll-mt-24">
                <CategoryNav />
            </div>

            <div id="masters" className="scroll-mt-24">
                <Suspense fallback={<div className="h-96 w-full animate-pulse bg-[#f0ebe4]" />}>
                    <MasterGallery />
                </Suspense>
            </div>

            <HowItWorks />

            <JealousyCard />

            <ManifestoBand />

            <HomepageFooter />
        </div>
    );
}
