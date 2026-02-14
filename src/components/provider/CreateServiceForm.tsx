'use client';

import { createService, updateService } from '@/app/actions/service';
import { uploadServicePhoto } from '@/app/actions/upload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';
import { LocationAutocomplete } from '@/components/LocationAutocomplete';
import { useState } from 'react';
import { toast } from 'react-hot-toast';

function SubmitButton({ isEditing, isLoading }: { isEditing: boolean, isLoading: boolean }) {
    return (
        <div className="relative z-[50]">
            <button
                type="submit"
                disabled={isLoading}
                className={`w-full h-12 text-base font-bold rounded-xl shadow-none transition-all flex items-center justify-center
                    ${isLoading ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-[#fc0] hover:bg-[#e6b800] text-black'}
                `}
            >
                {isLoading ? (isEditing ? 'Сохраняем...' : 'Публикуем...') : (isEditing ? 'Сохранить изменения' : 'Опубликовать')}
            </button>
        </div>
    );
}

interface CreateServiceFormProps {
    categories: { id: string; name: string; slug: string }[];
    cities: { id: string; name: string; slug: string }[];
    initialData?: {
        id: string;
        title: string;
        description: string;
        price: number;
        categoryId: string;
        cityId: string;
        subcategory: string | null;
        latitude: number | null;
        longitude: number | null;
        experience: number | null;
        equipment: string | null;
        schedule: string | null;
        workTime: string | null;
        locationType: string | null;
        priceList?: string | null;
        photos?: { id: string; url: string }[];
    };
    serviceId?: string;
}

const SUBCATEGORIES: Record<string, string[]> = {
    'auto': ['Автомойка', 'Шиномонтаж', 'Автомеханик', 'Кузовной ремонт', 'Электрик'],
    'beauty': ['Маникюр', 'Педикюр', 'Стрижка', 'Окрашивание', 'Макияж', 'Косметолог'],
    'cleaning': ['Поддерживающая уборка', 'Генеральная уборка', 'Мытье окон', 'Химчистка мебели'],
    'repair': ['Мелкий ремонт', 'Ремонт бытовой техники', 'Сборка мебели', 'Ремонт под ключ'],
    'plumbing': ['Установка сантехники', 'Устранение засоров', 'Ремонт труб'],
    'electrician': ['Монтаж проводки', 'Установка розеток', 'Ремонт освещения'],
    'computer-help': ['Установка ПО', 'Ремонт компьютеров', 'Настройка сетей', 'Удаление вирусов']
};

export function CreateServiceForm({ categories, cities, initialData, serviceId }: CreateServiceFormProps) {
    const isEditing = !!serviceId;
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});

    const initialCategory = categories.find(c => c.id === initialData?.categoryId);

    const [coordinates, setCoordinates] = useState<{ lat: number | null; lng: number | null }>({
        lat: initialData?.latitude ?? null,
        lng: initialData?.longitude ?? null
    });
    const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>(initialCategory?.slug || '');
    const [autoCityId, setAutoCityId] = useState<string>(initialData?.cityId || '');
    const [customCityName, setCustomCityName] = useState<string>('');

    // Price List State
    const [priceListItems, setPriceListItems] = useState<{ description: string; price: string }[]>(
        initialData?.priceList ? JSON.parse(initialData.priceList) : []
    );

    const addPriceItem = () => {
        setPriceListItems([...priceListItems, { description: '', price: '' }]);
    };

    // Subcategory State
    const initSubStates = () => {
        if (!initialData?.subcategory) return [];
        try {
            const parsed = JSON.parse(initialData.subcategory);
            if (Array.isArray(parsed)) {
                return parsed.map((item: any) => ({
                    value: item.name || '',
                    isCustom: item.isCustom ?? false,
                    price: item.price || '',
                    priceType: item.priceType || 'fixed'
                }));
            }
        } catch (e) { }
        return [];
    };

    const [subcategoryItems, setSubcategoryItems] = useState<{ value: string; isCustom: boolean; price: string; priceType: 'fixed' | 'agreement' }[]>(initSubStates());

    const addSubcategoryItem = () => {
        setSubcategoryItems([...subcategoryItems, { value: '', isCustom: false, price: '', priceType: 'fixed' }]);
    };

    const removeSubcategoryItem = (index: number) => {
        setSubcategoryItems(subcategoryItems.filter((_, i) => i !== index));
    };

    const updateSubcategoryItem = (index: number, field: 'value' | 'isCustom' | 'price' | 'priceType', value: any) => {
        const newItems = [...subcategoryItems];
        if (field === 'isCustom') {
            newItems[index] = { ...newItems[index], isCustom: value, value: '' };
        } else {
            newItems[index] = { ...newItems[index], [field]: value };
        }
        setSubcategoryItems(newItems);
    };

    const handleCategoryChange = (slug: string) => {
        setSelectedCategorySlug(slug);
        setSubcategoryItems([]);
    };

    const subcategoryJoinedValue = JSON.stringify(subcategoryItems.map(i => ({
        name: i.value.trim(),
        isCustom: i.isCustom,
        price: i.price,
        priceType: i.priceType
    })).filter(i => i.name));

    // Photo State
    // initialData?.photos is undefined because DirectoryService doesn't have photos relation, only Json
    // but in schema we added Json photos, so we treat it as urls array.
    const getInitialPhotos = () => {
        if (Array.isArray(initialData?.photos)) {
            // If legacy relation shape {id, url}
            if (initialData.photos.length > 0 && typeof initialData.photos[0] === 'object' && 'url' in initialData.photos[0]) {
                return initialData.photos.map(p => p.url);
            }
            // If new JSON string array
            return initialData.photos as unknown as string[];
        }
        return [];
    }

    const [uploadedPhotos, setUploadedPhotos] = useState<string[]>(getInitialPhotos());

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        for (let i = 0; i < files.length; i++) {
            const formData = new FormData();
            formData.append('photo', files[i]);

            try {
                const res = await uploadServicePhoto(formData);
                if (res.success && res.imageUrl) {
                    setUploadedPhotos(prev => [...prev, res.imageUrl]);
                }
            } catch (e) {
                console.error("Upload failed", e);
                toast.error('Ошибка загрузки фото');
            }
        }
    };

    const handleRemovePhoto = (index: number) => {
        setUploadedPhotos(prev => prev.filter((_, i) => i !== index));
    };

    const removePriceItem = (index: number) => {
        setPriceListItems(priceListItems.filter((_, i) => i !== index));
    };

    const updatePriceItem = (index: number, field: 'description' | 'price', value: string) => {
        const newItems = [...priceListItems];
        newItems[index] = { ...newItems[index], [field]: value };
        setPriceListItems(newItems);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // VALIDATION
        const newErrors: Record<string, string> = {};
        let isValid = true;

        if (!selectedCategorySlug) {
            newErrors.category = 'Выберите категорию';
            isValid = false;
        }

        const formData = new FormData(e.currentTarget);
        const desc = formData.get('description') as string;

        if (!desc || desc.trim().length < 20) {
            newErrors.description = 'Описание должно быть не менее 20 символов';
            isValid = false;
        }

        /* City validation disabled if no cities loaded
        if (!autoCityId) {
             // Check if we care?
        }
        */

        setErrors(newErrors);

        if (!isValid) {
            toast.error('Пожалуйста, исправьте ошибки в форме');
            return;
        }

        setIsSubmitting(true);
        setErrorMessage('');

        try {
            let res;
            if (isEditing && serviceId) {
                res = await updateService(serviceId, null, formData);
            } else {
                res = await createService(null, formData);
            }

            if (res && res.message) {
                setErrorMessage(res.message);
                toast.error(res.message);
                setIsSubmitting(false);
            }
        } catch (error: any) {
            if (error.message === 'NEXT_REDIRECT' || error.digest?.includes('NEXT_REDIRECT')) {
                return;
            }
            console.error("Submit Error:", error);
            setErrorMessage(error.message || 'Произошла ошибка при отправке');
            toast.error(error.message || 'Ошибка');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
            <Link href="/" className="flex items-center gap-2 mb-8">
                {/* Logo */}
            </Link>

            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-lg border border-gray-100">
                <h1 className="text-2xl font-bold mb-2 text-center text-gray-900">{isEditing ? 'Редактировать услугу' : 'Какую услугу вы хотите предложить?'}</h1>

                <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                    <input type="hidden" name="title" value={selectedCategorySlug ? `${categories.find(c => c.slug === selectedCategorySlug)?.name}` : 'Новая услуга'} />

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Категория <span className="text-red-500">*</span></label>
                        <select
                            name="categoryId"
                            required
                            defaultValue={initialData?.categoryId || ""}
                            className={`w-full h-11 px-3 bg-gray-50 border rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-black transition-all text-sm ${errors.category ? 'border-red-500 focus:ring-red-500' : 'border-gray-200'}`}
                            onChange={(e) => {
                                const category = categories.find(c => c.id === e.target.value);
                                handleCategoryChange(category?.slug || '');
                                setErrors({ ...errors, category: '' });
                            }}
                        >
                            <option value="" disabled>Выберите категорию</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                        {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
                    </div>

                    {selectedCategorySlug && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Подкатегория</label>
                            <div className="space-y-3">
                                {subcategoryItems.map((item, index) => (
                                    <div key={index} className="flex gap-2">
                                        <Input value={item.value} onChange={(e) => updateSubcategoryItem(index, 'value', e.target.value)} placeholder="Подкатегория" />
                                        <Button type="button" onClick={() => removeSubcategoryItem(index)} variant="ghost" className="text-red-500">X</Button>
                                    </div>
                                ))}
                                <Button type="button" onClick={addSubcategoryItem} variant="outline" className="w-full text-sm">+ Добавить подкатегорию</Button>
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Описание <span className="text-red-500">*</span></label>
                        <Textarea
                            name="description"
                            placeholder="Расскажите немного о себе... (минимум 20 символов)"
                            required
                            minLength={20}
                            defaultValue={initialData?.description}
                            className={`h-32 bg-gray-50 border focus:bg-white transition-all resize-none ${errors.description ? 'border-red-500 focus:ring-red-500' : 'border-gray-200'}`}
                            onChange={() => setErrors({ ...errors, description: '' })}
                        />
                        {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
                    </div>

                    <div className="space-y-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Фотографии работ</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {uploadedPhotos.map((photoUrl, index) => (
                                <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200 group">
                                    <img src={photoUrl} alt={`Work ${index + 1}`} className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => handleRemovePhoto(index)}
                                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        X
                                    </button>
                                </div>
                            ))}

                            <label className="relative aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-black transition-colors flex flex-col items-center justify-center cursor-pointer bg-gray-50 hover:bg-gray-100">
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handlePhotoUpload}
                                    className="hidden"
                                />
                                <span className="text-2xl text-gray-400 mb-1">+</span>
                                <span className="text-xs text-gray-500 font-medium">Добавить фото</span>
                            </label>
                        </div>
                        <input type="hidden" name="uploadedPhotoUrls" value={JSON.stringify(uploadedPhotos)} />
                    </div>

                    <input type="hidden" name="price" value="0" />
                    {/* Location Autocomplete - Simplified */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Местоположение</label>
                        <LocationAutocomplete
                            onSelect={(addr, lat, lng) => {
                                setCoordinates({ lat, lng });
                                // Logic to finding city... can be implemented or skipped
                                if (lat) {
                                    // Just store lat/lng
                                    setErrors({ ...errors, location: '' });
                                }
                            }}
                            className="bg-gray-50 border-gray-200 h-11 focus:bg-white"
                        />
                        <input type="hidden" name="latitude" value={coordinates.lat || ''} />
                        <input type="hidden" name="longitude" value={coordinates.lng || ''} />
                    </div>


                    <input type="hidden" name="subcategory" value={subcategoryJoinedValue} />
                    <input type="hidden" name="priceList" value={JSON.stringify(priceListItems)} />

                    <SubmitButton isEditing={isEditing} isLoading={isSubmitting} />

                    {errorMessage && (
                        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm text-center font-medium">
                            {errorMessage}
                        </div>
                    )}
                </form>

                <div className="mt-6 text-center">
                    <Link href="/provider/profile" className="text-sm text-gray-500 hover:text-black transition-colors">
                        Вернуться в кабинет
                    </Link>
                </div>
            </div>
        </div>
    );
}
