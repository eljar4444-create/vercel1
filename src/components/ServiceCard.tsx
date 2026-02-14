'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge } from '@/components/ui/badge';
import { useSession } from 'next-auth/react';

// Compatible definition for DirectoryService + Profile
export interface ServiceItem {
    id: number | string;
    title: string;
    description?: string | null;
    price: number | string;
    duration?: number | null;
    createdAt?: Date | string;
    profile: {
        name: string;
        city: string;
        image_url?: string | null;
        // fallback for potential legacy usage in other components
        image?: string | null;
        email?: string;
    };
    category?: {
        name: string;
    };
}

export function ServiceCard({ service, variant = 'vertical' }: { service: ServiceItem; variant?: 'vertical' | 'horizontal' }) {
    const [isContacting, setIsContacting] = useState(false);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const { data: session } = useSession();

    // Map legacy fields if necessary
    const providerName = service.profile?.name || 'Unknown Pro';
    const providerImage = service.profile?.image_url || service.profile?.image;
    const providerCity = service.profile?.city || 'Unknown';
    const serviceTitle = service.title;
    // Format price: if it's a number/decimal, add currency. If string, leave as is.
    const servicePrice = typeof service.price === 'number' || !isNaN(Number(service.price))
        ? `${Number(service.price).toFixed(2)} €`
        : service.price;

    const serviceDate = service.createdAt ? new Date(service.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }) : '';

    const handleContact = async () => {
        if (!session?.user) {
            toast.error('Пожалуйста, войдите, чтобы связаться с профессионалами');
            // window.location.href = '/auth/login'; // Optional: Redirect
            return;
        }

        if (!message.trim()) {
            toast.error('Пожалуйста, введите сообщение');
            return;
        }

        setLoading(true);
        // Simulate API call for now since /api/requests might be gone
        setTimeout(() => {
            toast.success('Запрос успешно отправлен! (Демо)');
            setIsContacting(false);
            setMessage('');
            setLoading(false);
        }, 1000);
    };

    if (variant === 'horizontal') {
        return (
            <Card className="group flex flex-col w-full hover:shadow-xl transition-all duration-300 border-gray-100/60 bg-white/50 backdrop-blur-sm hover:bg-white overflow-hidden ring-1 ring-gray-900/5 relative">
                <div className="h-1 bg-gradient-to-r from-blue-500 to-indigo-500 w-full" />
                <div className="flex flex-col md:flex-row p-6 gap-6">
                    <div className="flex md:flex-col items-center md:items-start gap-4 md:w-48 shrink-0 border-b md:border-b-0 md:border-r border-gray-100 pb-4 md:pb-0 md:pr-4">
                        <div className="relative shrink-0">
                            {providerImage ? (
                                <img src={providerImage} alt={providerName} className="w-16 h-16 rounded-full object-cover shadow-sm ring-2 ring-white" />
                            ) : (
                                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-xl font-bold text-gray-600 shadow-sm ring-2 ring-white">
                                    {providerName.charAt(0)}
                                </div>
                            )}
                            <div className="absolute -bottom-0.5 -right-0.5 bg-green-500 w-4 h-4 rounded-full border-2 border-white" />
                        </div>
                        <div className="flex flex-col text-center md:text-left">
                            <span className="text-lg font-bold text-gray-900 leading-tight mb-1">{providerName}</span>
                            <div className="flex items-center justify-center md:justify-start text-sm text-gray-500 gap-1 font-medium">
                                <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                <span>{providerCity}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 flex flex-col min-w-0">
                        <div className="flex justify-between items-start mb-2">
                            {/* Placeholder link since detail page might be missing */}
                            <Link href={`/services/${service.id}`} className="block hover:underline">
                                <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors leading-tight mb-1">{serviceTitle}</h3>
                            </Link>
                            <div className="md:hidden text-xs font-semibold text-gray-500 bg-gray-50 px-2 py-1 rounded-full whitespace-nowrap ml-2">
                                {serviceDate}
                            </div>
                        </div>

                        <Badge variant="secondary" className="w-fit mb-2">{servicePrice}</Badge>
                        <p className="text-gray-600 text-sm line-clamp-2 md:line-clamp-3 leading-relaxed mb-4">
                            {service.description || 'Описание отсутствует.'}
                        </p>
                        {isContacting && (
                            <div className="mt-auto animate-in fade-in slide-in-from-top-2 duration-300">
                                <textarea
                                    className="w-full min-h-[80px] p-3 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all resize-none shadow-inner mb-3"
                                    placeholder="Здравствуйте, меня интересует ваша услуга..."
                                    value={message}
                                    onChange={e => setMessage(e.target.value)}
                                    autoFocus
                                />
                                <div className="flex gap-2 justify-end">
                                    <Button variant="ghost" size="sm" onClick={() => setIsContacting(false)} className="px-4 rounded-full hover:bg-gray-200">Отмена</Button>
                                    <Button size="sm" onClick={handleContact} disabled={loading} className="bg-blue-600 rounded-full shadow-md">
                                        {loading ? 'Отправка...' : 'Отправить'}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="hidden md:flex flex-col items-end justify-between w-40 shrink-0 pl-4 border-l border-gray-100">
                        <div className="text-right">
                            <span className="text-[10px] text-gray-400 block mb-0.5">Опубликовано</span>
                            <span className="text-xs font-semibold text-gray-500 bg-gray-50 px-2 py-1 rounded-full">{serviceDate}</span>
                        </div>
                        {!isContacting && (
                            <Button onClick={() => setIsContacting(true)} className="w-full bg-blue-600 hover:bg-blue-700 rounded-full shadow-md shadow-blue-500/20">
                                <Mail className="w-4 h-4 mr-2" /> Связаться
                            </Button>
                        )}
                    </div>
                    {/* Mobile Actions */}
                    {!isContacting && (
                        <div className="md:hidden w-full pt-4 border-t border-gray-100 flex justify-end">
                            <Button size="sm" onClick={() => setIsContacting(true)} className="bg-blue-600 hover:bg-blue-700 rounded-full w-full">
                                <Mail className="w-4 h-4 mr-2" /> Связаться
                            </Button>
                        </div>
                    )}
                </div>
            </Card>
        );
    }

    return (
        <Card className="group flex flex-col h-full hover:shadow-xl transition-all duration-300 border-gray-100/60 bg-white/50 backdrop-blur-sm hover:bg-white overflow-hidden ring-1 ring-gray-900/5 hover:-translate-y-1 relative">
            <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-500 w-full" />
            <CardHeader className="pb-3 pt-5 px-6 border-b border-gray-50">
                <div className="flex justify-between items-start gap-4">
                    <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                            {providerImage ? (
                                <img src={providerImage} alt={providerName} className="w-14 h-14 rounded-full object-cover shadow-sm ring-2 ring-white" />
                            ) : (
                                <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-lg font-bold text-gray-600 shadow-sm ring-2 ring-white">
                                    {providerName.charAt(0)}
                                </div>
                            )}
                            <div className="absolute -bottom-0.5 -right-0.5 bg-green-500 w-3 h-3 rounded-full border-2 border-white" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-bold text-gray-900 leading-none">{providerName}</span>
                            <div className="flex items-center text-xs text-gray-500 gap-1 font-medium mt-1">
                                <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                                <span>{providerCity}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col items-end shrink-0">
                        <span className="text-xs text-gray-400 mb-0.5">Дата публикации</span>
                        <span className="text-xs font-semibold text-gray-500">
                            {serviceDate}
                        </span>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-grow pt-4 pb-0 px-6">
                <Link href={`/services/${service.id}`} className="block mb-2 after:absolute after:inset-0">
                    <h3 className="text-lg font-bold line-clamp-2 text-gray-900 group-hover:text-blue-600 transition-colors leading-tight">
                        {serviceTitle}
                    </h3>
                </Link>
                <Badge variant="outline" className="mb-3">{servicePrice}</Badge>
                <p className="text-gray-600 text-sm line-clamp-3 mb-4 leading-relaxed">
                    {service.description || 'Описание отсутствует.'}
                </p>
                {isContacting && (
                    <div className="mt-4 relative z-10 animate-in fade-in">
                        <textarea
                            className="w-full min-h-[100px] p-3 rounded-lg border border-gray-200 bg-gray-50 text-sm"
                            placeholder="Здравствуйте, меня интересует ваша услуга..."
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                        />
                    </div>
                )}
            </CardContent>
            <CardFooter className="pt-4 pb-5 px-6 flex justify-end items-center bg-gray-50/80">
                {!isContacting ? (
                    <Button size="sm" onClick={() => setIsContacting(true)} className="bg-blue-600 hover:bg-blue-700 rounded-full px-6 font-semibold relative z-10 hover:scale-105 active:scale-95 transition-all">
                        <Mail className="w-4 h-4 mr-2" /> Связаться
                    </Button>
                ) : (
                    <div className="flex gap-2 w-full relative z-10">
                        <Button variant="ghost" size="sm" onClick={() => setIsContacting(false)}>Отмена</Button>
                        <Button size="sm" onClick={handleContact} disabled={loading} className="flex-1 bg-blue-600 rounded-full">
                            {loading ? 'Отправка...' : 'Отправить'}
                        </Button>
                    </div>
                )}
            </CardFooter>
        </Card>
    );
}
