'use client';

import Link from 'next/link';

import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, CheckCircle, Mail, Star } from 'lucide-react'; // Added Star
import toast from 'react-hot-toast';
import axios from 'axios';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useSession } from 'next-auth/react';

interface Service {
    id: string;
    title: string;
    description: string;
    category: string;
    subcategory?: string | null;
    createdAt: Date | string; // Added date field
    city: string;
    provider: {
        name: string;
        email: string;
        image?: string | null;
    };
}

export function ServiceCard({ service, variant = 'vertical' }: { service: Service; variant?: 'vertical' | 'horizontal' }) {
    const [isContacting, setIsContacting] = useState(false);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    // Simple date formatter
    const formatDate = (date: Date | string) => {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long'
        });
    };

    // Helper to get subcategory display text
    const getSubcategoryDisplay = () => {
        if (!service.subcategory) return null;
        try {
            const parsed = JSON.parse(service.subcategory);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed[0].name; // Just show the name of the first one
            }
        } catch (e) {
            return service.subcategory; // Legacy string
        }
        return service.subcategory;
    };

    const subcategoryDisplay = getSubcategoryDisplay();
    const { data: session } = useSession();

    const handleContact = async () => {
        if (!session?.user) {
            toast.error('Пожалуйста, войдите, чтобы связаться с профессионалами');
            window.location.href = '/auth/login';
            return;
        }
        const user = session.user;


        if (!message.trim()) {
            toast.error('Пожалуйста, введите сообщение');
            return;
        }

        setLoading(true);
        try {
            await axios.post('/api/requests', {
                serviceId: service.id,
                clientId: user.id,
                providerId: 'resolved-by-backend',
                message: message
            });
            toast.success('Запрос успешно отправлен!');
            setIsContacting(false);
            setMessage('');
        } catch (error) {
            console.error('Send request error:', error);
            toast.error('Не удалось отправить запрос. Попробуйте еще раз.');
        } finally {
            setLoading(false);
        }
    };

    if (variant === 'horizontal') {
        return (
            <Card className="group flex flex-col w-full hover:shadow-xl transition-all duration-300 border-gray-100/60 bg-white/50 backdrop-blur-sm hover:bg-white overflow-hidden ring-1 ring-gray-900/5 relative">
                <div className="h-1 bg-gradient-to-r from-blue-500 to-indigo-500 w-full" />

                <div className="flex flex-col md:flex-row p-6 gap-6">
                    {/* Left: Provider Info */}
                    <div className="flex md:flex-col items-center md:items-start gap-4 md:w-48 shrink-0 border-b md:border-b-0 md:border-r border-gray-100 pb-4 md:pb-0 md:pr-4">
                        <div className="relative shrink-0">
                            {service.provider.image ? (
                                <img
                                    src={service.provider.image}
                                    alt={service.provider.name}
                                    className="w-16 h-16 rounded-full object-cover shadow-sm ring-2 ring-white"
                                />
                            ) : (
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-xl font-bold text-gray-600 shadow-sm ring-2 ring-white">
                                    {service.provider.name.charAt(0)}
                                </div>
                            )}
                            <div className="absolute -bottom-0.5 -right-0.5 bg-green-500 w-4 h-4 rounded-full border-2 border-white" />
                        </div>

                        <div className="flex flex-col min-w-0 text-center md:text-left">
                            <span className="text-lg font-bold text-gray-900 leading-tight mb-1">
                                {service.provider.name}
                            </span>
                            <div className="flex items-center justify-center md:justify-start text-sm text-gray-500 gap-1 font-medium">
                                <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                <span>{service.city}</span>
                            </div>
                        </div>
                    </div>

                    {/* Middle: Service Details */}
                    <div className="flex-1 flex flex-col min-w-0">
                        <div className="flex justify-between items-start mb-2">
                            <Link href={`/services/${service.id}`} className="block">
                                <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors leading-tight">
                                    {subcategoryDisplay || service.title}
                                </h3>
                            </Link>
                            {/* Mobile Date Display */}
                            <div className="md:hidden text-xs font-semibold text-gray-500 bg-gray-50 px-2 py-1 rounded-full whitespace-nowrap ml-2">
                                {formatDate(service.createdAt)}
                            </div>
                        </div>

                        <p className="text-gray-600 text-sm line-clamp-2 md:line-clamp-3 leading-relaxed mb-4">
                            {service.description}
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

                    {/* Right: Actions (Desktop) */}
                    <div className="hidden md:flex flex-col items-end justify-between w-40 shrink-0 pl-4 border-l border-gray-100">
                        <div className="text-right">
                            <span className="text-[10px] text-gray-400 block mb-0.5">Опубликовано</span>
                            <span className="text-xs font-semibold text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
                                {formatDate(service.createdAt)}
                            </span>
                        </div>

                        {!isContacting && (
                            <Button
                                onClick={() => setIsContacting(true)}
                                className="w-full bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 rounded-full font-semibold transition-all hover:scale-105 active:scale-95"
                            >
                                <Mail className="w-4 h-4 mr-2" /> Связаться
                            </Button>
                        )}
                    </div>

                    {/* Mobile Actions */}
                    {!isContacting && (
                        <div className="md:hidden w-full pt-4 border-t border-gray-100 flex justify-end">
                            <Button
                                size="sm"
                                onClick={() => setIsContacting(true)}
                                className="bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 rounded-full px-6 font-semibold transition-all w-full"
                            >
                                <Mail className="w-4 h-4 mr-2" /> Связаться
                            </Button>
                        </div>
                    )}
                </div>
            </Card >
        );
    }

    // Default Vertical Layout
    return (
        <Card className="group flex flex-col h-full hover:shadow-xl transition-all duration-300 border-gray-100/60 bg-white/50 backdrop-blur-sm hover:bg-white overflow-hidden ring-1 ring-gray-900/5 hover:-translate-y-1 relative">
            <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-500 w-full" />
            <CardHeader className="pb-3 pt-5 px-6 border-b border-gray-50">
                <div className="flex justify-between items-start gap-4">
                    <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                            {service.provider.image ? (
                                <img
                                    src={service.provider.image}
                                    alt={service.provider.name}
                                    className="w-14 h-14 rounded-full object-cover shadow-sm ring-2 ring-white"
                                />
                            ) : (
                                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-lg font-bold text-gray-600 shadow-sm ring-2 ring-white">
                                    {service.provider.name.charAt(0)}
                                </div>
                            )}
                            <div className="absolute -bottom-0.5 -right-0.5 bg-green-500 w-3 h-3 rounded-full border-2 border-white" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-2xl font-bold text-gray-900 leading-none">
                                {service.provider.name}
                            </span>
                            <div className="flex items-center text-sm text-gray-500 gap-1 font-medium mt-1">
                                <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                <span>{service.city}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col items-end shrink-0">
                        <span className="text-xs text-gray-400 mb-0.5">Дата публикации</span>
                        <span className="text-xs font-semibold text-gray-500">
                            {formatDate(service.createdAt)}
                        </span>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="flex-grow pt-4 pb-0 px-6">
                <Link href={`/services/${service.id}`} className="block mb-2 after:absolute after:inset-0">
                    <h3 className="text-lg font-bold line-clamp-2 text-gray-900 group-hover:text-blue-600 transition-colors leading-tight">
                        {subcategoryDisplay || service.title}
                    </h3>
                </Link>

                <p className="text-gray-600 text-sm line-clamp-3 mb-4 leading-relaxed">
                    {service.description}
                </p>

                {isContacting && (
                    <div className="mt-4 animate-in fade-in slide-in-from-bottom-2 duration-300 relative z-10">
                        <textarea
                            className="w-full min-h-[100px] p-3 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all resize-none shadow-inner"
                            placeholder="Здравствуйте, меня интересует ваша услуга..."
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                            autoFocus
                        />
                    </div>
                )}
            </CardContent>

            <CardFooter className="pt-4 pb-5 px-6 flex justify-end items-center bg-gray-50/80">
                {!isContacting ? (
                    <>
                        <Button
                            size="sm"
                            onClick={() => setIsContacting(true)}
                            className="bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 rounded-full px-6 font-semibold transition-all hover:scale-105 active:scale-95 relative z-10"
                        >
                            <Mail className="w-4 h-4 mr-2" /> Связаться
                        </Button>
                    </>
                ) : (
                    <div className="flex gap-2 w-full relative z-10">
                        <Button variant="ghost" size="sm" onClick={() => setIsContacting(false)} className="px-4 rounded-full hover:bg-gray-200">Отмена</Button>
                        <Button size="sm" onClick={handleContact} disabled={loading} className="flex-1 bg-blue-600 rounded-full shadow-md">
                            {loading ? 'Отправка...' : 'Отправить'}
                        </Button>
                    </div>
                )}
            </CardFooter>
        </Card>
    );
}
