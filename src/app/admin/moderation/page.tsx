import prisma from '@/lib/prisma';
export const dynamic = 'force-dynamic';
import { ModerationControls } from '@/components/admin/ModerationControls';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ShieldAlert, MapPin, Calendar } from 'lucide-react';

export default async function ModerationPage() {
    // 1. Fetch all services with status 'PENDING'
    const pendingServices = await prisma.service.findMany({
        where: {
            status: 'PENDING'
        },
        include: {
            providerProfile: {
                include: {
                    user: true
                }
            },
            category: true,
            city: true
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    return (
        <div className="container mx-auto py-10 px-4 max-w-5xl">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Модерация услуг</h1>
                    <p className="text-gray-500 mt-2">
                        Ожидают проверки: {pendingServices.length}
                    </p>
                </div>
                <div className="flex gap-4">
                    <Link href="/admin/verification">
                        <Button variant="outline">
                            Проверка документов
                        </Button>
                    </Link>
                    <Link href="/" className="text-blue-600 hover:underline flex items-center">
                        Вернуться на главную
                    </Link>
                </div>
            </div>

            {pendingServices.length === 0 ? (
                <div className="bg-white rounded-xl p-12 text-center border border-gray-100 shadow-sm">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ShieldAlert className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Все чисто!</h3>
                    <p className="text-gray-500">Нет новых услуг, требующих проверки.</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {pendingServices.map((service) => (
                        <Card key={service.id} className="p-6 overflow-hidden">
                            <div className="flex flex-col md:flex-row gap-6">
                                {/* Image / Avatar */}
                                <div className="shrink-0">
                                    <div className="w-24 h-24 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 font-bold text-xl overflow-hidden">
                                        {/* Ideally show service images here if enabled, or provider avatar */}
                                        {service.providerProfile.user.image ? (
                                            <img src={service.providerProfile.user.image} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            service.providerProfile.user.name?.[0] || 'S'
                                        )}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-4 mb-2">
                                        <div>
                                            <Badge variant="outline" className="mb-2">
                                                {service.category?.name || 'Без категории'}
                                            </Badge>
                                            <h3 className="text-xl font-bold text-gray-900 line-clamp-1">
                                                {service.title}
                                            </h3>
                                        </div>
                                        <div className="text-lg font-bold text-green-600 whitespace-nowrap">
                                            {service.price} €
                                        </div>
                                    </div>

                                    <p className="text-gray-600 mb-4 line-clamp-3">
                                        {service.description}
                                    </p>

                                    <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-6">
                                        <div className="flex items-center gap-1">
                                            <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
                                                {service.providerProfile.user.name?.[0]}
                                            </div>
                                            <span className="font-medium text-gray-900">{service.providerProfile.user.name}</span>
                                        </div>
                                        {service.city && (
                                            <div className="flex items-center gap-1">
                                                <MapPin className="w-4 h-4" />
                                                {service.city.name}
                                            </div>
                                        )}
                                        <div className="flex items-center gap-1">
                                            <Calendar className="w-4 h-4" />
                                            {new Date(service.createdAt).toLocaleDateString('ru-RU')}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                        <div className="text-xs text-gray-400">
                                            ID: {service.id}
                                        </div>
                                        <ModerationControls serviceId={service.id} />
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
