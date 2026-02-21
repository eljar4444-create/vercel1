'use client';

import { createService, updateService } from '@/app/actions/service';
import { uploadServicePhoto } from '@/app/actions/upload';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { BEAUTY_SERVICES, getBeautyServicePath } from '@/lib/constants/services-taxonomy';
import Link from 'next/link';
import { Loader2, Upload, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';

interface CreateServiceFormProps {
    initialData?: {
        id: number;
        title: string;
        description?: string | null;
        price: number;
        duration_min: number;
        images?: string[];
    };
    serviceId?: string;
}

export function CreateServiceForm({ initialData, serviceId }: CreateServiceFormProps) {
    const isEditing = !!serviceId;
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const taxonomyPath = useMemo(
        () => (initialData?.title ? getBeautyServicePath(initialData.title) : null),
        [initialData?.title]
    );
    const [selectedCategory, setSelectedCategory] = useState<string>(taxonomyPath?.category || '');
    const [selectedSubcategory, setSelectedSubcategory] = useState<string>(taxonomyPath?.subcategory || '');
    const [selectedService, setSelectedService] = useState<string>(taxonomyPath?.title || '');
    const [description, setDescription] = useState(initialData?.description || '');
    const [uploadedPhotos, setUploadedPhotos] = useState<string[]>(initialData?.images || []);

    const categoryOptions = useMemo(() => Object.keys(BEAUTY_SERVICES), []);
    const subcategoryOptions = useMemo(() => {
        if (!selectedCategory) return [];
        return Object.keys(BEAUTY_SERVICES[selectedCategory as keyof typeof BEAUTY_SERVICES]);
    }, [selectedCategory]);
    const serviceOptions = useMemo(() => {
        if (!selectedCategory || !selectedSubcategory) return [];
        return BEAUTY_SERVICES[selectedCategory as keyof typeof BEAUTY_SERVICES][
            selectedSubcategory as keyof (typeof BEAUTY_SERVICES)[keyof typeof BEAUTY_SERVICES]
        ] || [];
    }, [selectedCategory, selectedSubcategory]);

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        setIsUploading(true);
        try {
            let currentCount = uploadedPhotos.length;
            for (const file of Array.from(files)) {
                if (currentCount >= 10) {
                    toast.error('Можно загрузить максимум 10 фото.');
                    break;
                }

                const formData = new FormData();
                formData.append('photo', file);
                const res = await uploadServicePhoto(formData);
                if (res.success && res.imageUrl) {
                    currentCount += 1;
                    setUploadedPhotos((prev) => [...prev, res.imageUrl]);
                }
            }
        } catch (uploadError: any) {
            console.error('Upload failed', uploadError);
            toast.error(uploadError?.message || 'Ошибка загрузки фото');
        } finally {
            setIsUploading(false);
            e.target.value = '';
        }
    };

    const handleRemovePhoto = (index: number) => {
        setUploadedPhotos(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!selectedService) {
            toast.error('Выберите услугу из справочника.');
            return;
        }

        const formData = new FormData(e.currentTarget);
        formData.set('title', selectedService);
        formData.set('description', description.trim());
        formData.set('images', JSON.stringify(uploadedPhotos));

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
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-lg border border-gray-100">
                <h1 className="text-2xl font-bold mb-2 text-center text-gray-900">{isEditing ? 'Редактировать услугу' : 'Какую услугу вы хотите предложить?'}</h1>

                <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Категория <span className="text-red-500">*</span></label>
                        <select
                            required
                            value={selectedCategory}
                            className="w-full h-11 px-3 bg-gray-50 border border-gray-200 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-black transition-all text-sm"
                            onChange={(e) => {
                                setSelectedCategory(e.target.value);
                                setSelectedSubcategory('');
                                setSelectedService('');
                            }}
                        >
                            <option value="" disabled>Выберите категорию</option>
                            {categoryOptions.map((category) => (
                                <option key={category} value={category}>
                                    {category}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Подкатегория <span className="text-red-500">*</span></label>
                        <select
                            required
                            value={selectedSubcategory}
                            disabled={!selectedCategory}
                            className="w-full h-11 px-3 bg-gray-50 border border-gray-200 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-black transition-all text-sm disabled:opacity-60"
                            onChange={(e) => {
                                setSelectedSubcategory(e.target.value);
                                setSelectedService('');
                            }}
                        >
                            <option value="" disabled>
                                {selectedCategory ? 'Выберите подкатегорию' : 'Сначала выберите категорию'}
                            </option>
                            {subcategoryOptions.map((subcategory) => (
                                <option key={subcategory} value={subcategory}>
                                    {subcategory}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Услуга <span className="text-red-500">*</span></label>
                        <select
                            name="title"
                            required
                            value={selectedService}
                            disabled={!selectedSubcategory}
                            className="w-full h-11 px-3 bg-gray-50 border border-gray-200 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-black transition-all text-sm disabled:opacity-60"
                            onChange={(e) => setSelectedService(e.target.value)}
                        >
                            <option value="" disabled>
                                {selectedSubcategory ? 'Выберите услугу' : 'Сначала выберите подкатегорию'}
                            </option>
                            {serviceOptions.map((service) => (
                                <option key={service} value={service}>
                                    {service}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Описание <span className="text-red-500">*</span></label>
                        <Textarea
                            name="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Опишите, что входит в процедуру"
                            required
                            className="h-32 bg-gray-50 border border-gray-200 focus:bg-white transition-all resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Цена (€)</label>
                            <input
                                name="price"
                                type="number"
                                step="0.01"
                                min="0"
                                required
                                defaultValue={initialData?.price ?? 0}
                                className="w-full h-11 px-3 bg-gray-50 border border-gray-200 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-black transition-all text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Длительность (мин)</label>
                            <input
                                name="duration_min"
                                type="number"
                                min="1"
                                required
                                defaultValue={initialData?.duration_min ?? 60}
                                className="w-full h-11 px-3 bg-gray-50 border border-gray-200 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-black transition-all text-sm"
                            />
                        </div>
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
                                        className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X className="h-3.5 w-3.5" />
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
                                    disabled={isUploading || uploadedPhotos.length >= 10}
                                />
                                {isUploading ? <Loader2 className="h-5 w-5 text-gray-400 animate-spin mb-1" /> : <Upload className="h-5 w-5 text-gray-400 mb-1" />}
                                <span className="text-xs text-gray-500 font-medium">Добавить фото</span>
                            </label>
                        </div>
                        <p className="text-xs text-gray-500">До 10 фото на услугу ({uploadedPhotos.length}/10)</p>
                        <input type="hidden" name="images" value={JSON.stringify(uploadedPhotos)} />
                    </div>

                    <Button type="submit" disabled={isSubmitting || isUploading} className="w-full h-12 bg-black hover:bg-black/90 text-white rounded-xl">
                        {isSubmitting ? 'Сохраняем...' : isEditing ? 'Сохранить изменения' : 'Опубликовать'}
                    </Button>

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
