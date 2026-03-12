'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { createOrder } from '@/app/actions/createOrder';
import { useState } from 'react';
import { SUB_CATEGORIES } from '@/constants/categories';

import dynamic from 'next/dynamic';

const LocationAutocomplete = dynamic(() => import('@/components/LocationAutocomplete').then(mod => mod.LocationAutocomplete), { ssr: false, loading: () => <div className="h-12 w-full bg-slate-50 animate-pulse rounded-xl" /> });

interface Category {
    id: string;
    name: string;
    slug: string;
}

export function CreateOrderForm({ categories }: { categories: Category[] }) {
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
    const [address, setAddress] = useState('');
    const [coordinates, setCoordinates] = useState<{ lat: number | null; lng: number | null }>({ lat: null, lng: null });
    const { data: session } = useSession();
    const router = useRouter();

    const selectedCategory = categories.find(c => c.id === selectedCategoryId);
    const subcategories = selectedCategory ? SUB_CATEGORIES[selectedCategory.slug] || [] : [];

    const handleSubmit = (e: React.FormEvent) => {
        if (!session?.user) {
            e.preventDefault();
            router.push('/auth/register');
        }
    };

    return (
        <form
            action={createOrder}
            onSubmit={handleSubmit}
            className="bg-white border border-gray-200 rounded-3xl shadow-sm p-8 mb-8 relative"
        >
            <div className="space-y-4 mb-6">
                {/* Category Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 pl-1">Категория</label>
                        <select
                            name="categoryId"
                            required
                            value={selectedCategoryId}
                            onChange={(e) => setSelectedCategoryId(e.target.value)}
                            className="w-full h-12 bg-white border border-gray-300 rounded-xl px-4 text-gray-900 outline-none focus:ring-2 focus:ring-blue-100"
                        >
                            <option value="" disabled>Выберите категорию</option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Subcategory Selection (Conditional) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 pl-1">Подкатегория</label>
                        <select
                            name="subcategory"
                            disabled={!selectedCategoryId || subcategories.length === 0}
                            className="w-full h-12 bg-white border border-gray-300 rounded-xl px-4 text-gray-900 outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-gray-50 disabled:text-gray-400"
                        >
                            <option value="" disabled defaultValue="">Выберите услугу</option>
                            {subcategories.map((sub) => (
                                <option key={sub} value={sub}>
                                    {sub}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <Input
                    name="title"
                    required
                    placeholder="Короткое название задачи (например, Уборка квартиры)"
                    className="h-14 text-lg bg-white border-gray-300 rounded-xl px-4 placeholder:text-gray-400"
                />
                <textarea
                    name="description"
                    required
                    placeholder="Расскажите подробнее о задаче..."
                    className="w-full h-32 p-4 text-base bg-white border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 resize-none placeholder:text-gray-400"
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        name="budget"
                        type="number"
                        placeholder="Бюджет (необязательно)"
                        className="h-12 bg-white border-gray-300 rounded-xl px-4"
                    />
                    <div className="relative">
                        <LocationAutocomplete
                            onSelect={(addr, lat, lng) => {
                                setAddress(addr);
                                setCoordinates({ lat, lng });
                            }}
                            className="h-12 bg-white border-gray-300 rounded-xl px-4"
                            defaultValue=""
                        />
                        <input type="hidden" name="address" value={address} />
                        <input type="hidden" name="latitude" value={coordinates.lat || ''} />
                        <input type="hidden" name="longitude" value={coordinates.lng || ''} />
                    </div>
                </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-end">
                <Button type="submit" className="bg-[#ff5c00] hover:bg-[#e65500] text-white rounded-xl px-8 py-6 h-auto text-base font-medium shadow-lg shadow-orange-500/20">
                    Опубликовать
                </Button>
            </div>
        </form>
    );
}
