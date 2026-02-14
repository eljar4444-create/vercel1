// import { SearchHero } from '@/components/SearchHero';
// import { ServiceCard } from '@/components/ServiceCard';
// import { HomeCategories } from '@/components/HomeCategories';
// import prisma from '@/lib/prisma';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
// import { ArrowRight, Star, ShieldCheck, Zap } from 'lucide-react';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export default async function Home() {
    // const session = await auth(); // Session might work if auth.ts is fixed
    // Legacy fetching removed

    return (
        <div className="bg-[#f5f5f7] min-h-screen pb-20">
            {/* <SearchHero categories={[]} user={session?.user} /> */}

            <div className="container mx-auto px-4 py-20 text-center">
                <h1 className="text-4xl font-bold mb-4">Welcome to Svoi.de</h1>
                <p className="text-gray-600 mb-8">We are undergoing a major upgrade. Please check back soon.</p>
                <div className="flex justify-center gap-4">
                    <Link href="/auth/signin"><Button>Login</Button></Link>
                </div>
            </div>
        </div>
    );
}
