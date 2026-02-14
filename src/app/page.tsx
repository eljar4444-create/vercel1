import prisma from '@/lib/prisma';
import Link from 'next/link';
import * as Icons from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

export default async function Home() {
    const categories = await prisma.category.findMany({
        orderBy: { name: 'asc' }
    });

    return (
        <div className="bg-[#f5f5f7] min-h-screen pb-20">
            {/* Hero Section */}
            <div className="bg-white border-b">
                <div className="container mx-auto px-4 py-20 text-center max-w-4xl">
                    <h1 className="text-4xl md:text-6xl font-bold mb-6 text-gray-900 tracking-tight">
                        Find the perfect professional for any task
                    </h1>
                    <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
                        From home repairs to beauty services, connect with trusted local experts in minutes.
                    </p>
                    <div className="flex justify-center gap-4">
                        <Link href="/search">
                            <Button size="lg" className="rounded-full px-8 text-lg h-12">
                                Browse Services
                            </Button>
                        </Link>
                        <Link href="/become-provider">
                            <Button variant="outline" size="lg" className="rounded-full px-8 text-lg h-12">
                                Become a Pro
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Categories Grid */}
            <div className="container mx-auto px-4 py-16">
                <h2 className="text-2xl font-bold mb-8 text-gray-900">Popular Categories</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-6">
                    {categories.map((cat) => {
                        // Dynamically render icon, fallback to Circle
                        const Icon = (Icons as any)[cat.icon || 'Circle'] || Icons.Circle;
                        return (
                            <Link key={cat.id} href={`/search?category=${cat.slug}`} className="group">
                                <Card className="p-8 hover:shadow-xl transition-all duration-300 flex flex-col items-center justify-center text-center gap-4 h-full border-transparent hover:border-blue-100 group-hover:-translate-y-1">
                                    <div className="p-4 bg-blue-50 rounded-2xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                                        <Icon className="w-8 h-8" />
                                    </div>
                                    <div className="font-semibold text-lg text-gray-800">{cat.name}</div>
                                </Card>
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* Trust Section */}
            <div className="bg-white py-20 border-t">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-3xl font-bold mb-12">Why use Svoi.de?</h2>
                    <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-2">
                                <Icons.ShieldCheck className="w-8 h-8" />
                            </div>
                            <h3 className="font-bold text-xl">Verified Pros</h3>
                            <p className="text-gray-600">Every professional goes through a rigorous verification process.</p>
                        </div>
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 mb-2">
                                <Icons.Zap className="w-8 h-8" />
                            </div>
                            <h3 className="font-bold text-xl">Fast Booking</h3>
                            <p className="text-gray-600">Connect with experts and book services in just a few clicks.</p>
                        </div>
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 mb-2">
                                <Icons.Heart className="w-8 h-8" />
                            </div>
                            <h3 className="font-bold text-xl">Satisfaction Guaranteed</h3>
                            <p className="text-gray-600">We ensure high-quality service for every request you make.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
