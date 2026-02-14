import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Metadata } from 'next';
import { MapPin, Calendar, Clock, Euro } from 'lucide-react';
import Link from 'next/link';
import ServiceMap from '@/components/ServiceMap';

interface Props {
    params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const id = parseInt(params.id);
    if (isNaN(id)) return { title: 'Service Not Found' };

    const service = await prisma.directoryService.findUnique({
        where: { id },
        include: { profile: true }
    });

    if (!service) return { title: 'Service Not Found' };

    return {
        title: `${service.title} | ${service.profile.name} - Svoi.de`,
        description: service.description || `Service by ${service.profile.name}`
    };
}

export default async function ServicePage({ params }: Props) {
    const id = parseInt(params.id);
    if (isNaN(id)) notFound();

    const service = await prisma.directoryService.findUnique({
        where: { id },
        include: {
            profile: {
                include: {
                    category: true
                }
            }
        }
    });

    if (!service) notFound();

    // Mock coordinates for now if not in DB
    const lat = 52.52;
    const lng = 13.405;

    return (
        <div className="container mx-auto px-4 py-8">
            <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block">&larr; Back to Search</Link>

            <div className="grid md:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="md:col-span-2 space-y-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">{service.title}</h1>
                        <div className="flex items-center text-gray-500 gap-4">
                            <span className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" /> {service.profile.city}
                            </span>
                            <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" /> Posted {service.profile.created_at.toLocaleDateString()}
                            </span>
                        </div>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Description</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                                {service.description || 'No description provided.'}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Placeholder for Map */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Location</CardTitle>
                            <CardDescription>{service.profile.city}</CardDescription>
                        </CardHeader>
                        <CardContent className="h-64 bg-gray-100 flex items-center justify-center rounded-b-xl">
                            <p className="text-gray-500 italic">Map component will be restored here.</p>
                            {/* Integration point for Map component */}
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <Card className="sticky top-24">
                        <CardHeader>
                            <div className="flex items-center gap-4">
                                {service.profile.image_url ? (
                                    <img src={service.profile.image_url} alt={service.profile.name} className="w-16 h-16 rounded-full object-cover" />
                                ) : (
                                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-xl font-bold">
                                        {service.profile.name[0]}
                                    </div>
                                )}
                                <div>
                                    <CardTitle className="text-lg">{service.profile.name}</CardTitle>
                                    <div className="text-sm text-green-600 font-medium">Verified Provider</div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <span className="text-gray-600 flex items-center gap-2"><Euro className="w-4 h-4" /> Price</span>
                                <span className="font-bold text-xl">{service.price.toString()} €</span>
                            </div>

                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <span className="text-gray-600 flex items-center gap-2"><Clock className="w-4 h-4" /> Duration</span>
                                <span className="font-semibold">{service.duration} min</span>
                            </div>

                            <Button className="w-full text-lg py-6 bg-blue-600 hover:bg-blue-700">
                                Contact Provider
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
