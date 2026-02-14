import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Settings, Plus, MapPin } from 'lucide-react';

export default async function ProviderProfilePage() {
    const session = await auth();
    if (!session?.user) redirect('/auth/login');

    const profile = await prisma.profile.findUnique({
        where: { user_email: session.user.email || '' },
        include: {
            services: true,
            category: true
        }
    });

    if (!profile) {
        return (
            <div className="container mx-auto px-4 py-24 text-center">
                <h1 className="text-2xl font-bold mb-4">Профиль исполнителя не найден</h1>
                <Button asChild>
                    <Link href="/become-provider">Стать исполнителем</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pt-24 pb-12">
            <div className="container mx-auto px-4 max-w-5xl">
                {/* Header Section */}
                <div className="flex justify-between items-start mb-8 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-6">
                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden border border-gray-200">
                            {profile.image_url ? (
                                <img src={profile.image_url} alt={profile.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="text-3xl font-bold text-gray-400">{profile.name[0]}</div>
                            )}
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{profile.name}</h1>
                            <div className="flex items-center gap-2 text-gray-500 mt-1">
                                <MapPin className="w-4 h-4" />
                                <span>{profile.city}</span>
                            </div>
                            <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-medium border border-blue-100">
                                {profile.category.name}
                            </div>
                        </div>
                    </div>
                    <Button variant="outline" asChild>
                        <Link href="/provider/settings" className="flex items-center gap-2">
                            <Settings className="w-4 h-4" />
                            Настройки
                        </Link>
                    </Button>
                </div>

                {/* Services Section */}
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-gray-900">Мои услуги</h2>
                        <Button asChild size="sm" className="bg-black hover:bg-gray-800 text-white">
                            <Link href="/services/new" className="flex items-center gap-2">
                                <Plus className="w-4 h-4" />
                                Добавить услугу
                            </Link>
                        </Button>
                    </div>

                    <div className="grid gap-4">
                        {profile.services.length > 0 ? (
                            profile.services.map(service => (
                                <Card key={service.id} className="group hover:shadow-md transition-shadow duration-200 border-gray-200">
                                    <CardContent className="p-6 flex justify-between items-center">
                                        <div>
                                            <h3 className="font-semibold text-lg mb-1">{service.title}</h3>
                                            <p className="text-gray-500 text-sm mb-2 max-w-xl truncate">{service.description || 'Без описания'}</p>
                                            <div className="font-medium text-gray-900">
                                                {Number(service.price).toFixed(2)} €
                                                <span className="text-gray-400 text-sm font-normal ml-1">
                                                    / {service.duration} мин
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href={`/services/${service.id}`}>Просмотр</Link>
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200">
                                <p className="text-gray-500 mb-4">У вас пока нет активных услуг</p>
                                <Button asChild variant="outline">
                                    <Link href="/services/new">Создать первую услугу</Link>
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
