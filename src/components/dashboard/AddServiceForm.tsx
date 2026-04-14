'use client';

import { useMemo, useState, useEffect } from 'react';
import { Plus, Loader2, AlertCircle, Save } from 'lucide-react';
import { addService, createService, updateService } from '@/app/actions/services';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { BEAUTY_SERVICES, getBeautyServicePath } from '@/lib/constants/services-taxonomy';

interface AddServiceFormProps {
    profileId?: number;
    initialData?: {
        id: number;
        title: string;
        description?: string | null;
        price: number;
        duration_min: number;
        images?: string[];
    };
    serviceId?: string;
    returnHref?: string;
    compact?: boolean;
    onSaved?: (service: {
        id: number;
        title: string;
        description?: string | null;
        images?: string[];
        price: string;
        duration_min: number;
    }) => void;
}

export function AddServiceForm({
    profileId,
    initialData,
    serviceId,
    returnHref,
    compact = false,
    onSaved,
}: AddServiceFormProps) {
    const isEditing = Boolean(serviceId);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const taxonomyPath = useMemo(
        () => (initialData?.title ? getBeautyServicePath(initialData.title) : null),
        [initialData?.title]
    );
    const [selectedCategory, setSelectedCategory] = useState(taxonomyPath?.category || '');
    const [selectedSubcategory, setSelectedSubcategory] = useState(taxonomyPath?.subcategory || '');
    const [selectedService, setSelectedService] = useState(taxonomyPath?.title || '');
    const [description, setDescription] = useState(initialData?.description || '');
    const [images, setImages] = useState<string[]>(initialData?.images || []);
    const [price, setPrice] = useState(
        initialData && Number(initialData.price) > 0 ? String(initialData.price) : ''
    );
    const [duration, setDuration] = useState(
        initialData && initialData.duration_min > 0 ? String(initialData.duration_min) : ''
    );
    const [byAgreement, setByAgreement] = useState(
        initialData ? Number(initialData.price) === 0 && initialData.duration_min === 0 : false
    );

    const categoryOptions = useMemo(() => Object.keys(BEAUTY_SERVICES), []);
    const subcategoryOptions = useMemo(() => {
        if (!selectedCategory) return [];
        return Object.keys(BEAUTY_SERVICES[selectedCategory as keyof typeof BEAUTY_SERVICES]);
    }, [selectedCategory]);
    const serviceOptions = useMemo((): string[] => {
        if (!selectedCategory || !selectedSubcategory) return [];
        const list = BEAUTY_SERVICES[selectedCategory as keyof typeof BEAUTY_SERVICES]?.[
            selectedSubcategory as keyof (typeof BEAUTY_SERVICES)[keyof typeof BEAUTY_SERVICES]
        ];
        return list ? [...list] : [];
    }, [selectedCategory, selectedSubcategory]);

    // Если в подкатегории одна услуга (например «Консультация») — подставляем её сразу, без второго выбора
    useEffect(() => {
        if (serviceOptions.length === 1 && selectedService !== serviceOptions[0]) {
            setSelectedService(serviceOptions[0]);
        }
        if (serviceOptions.length !== 1 && selectedSubcategory && !serviceOptions.includes(selectedService)) {
            setSelectedService('');
        }
    }, [selectedSubcategory, serviceOptions, selectedService]);

    useEffect(() => {
        if (byAgreement) {
            setPrice('');
            setDuration('');
        }
    }, [byAgreement]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        if (!selectedService) {
            setIsSubmitting(false);
            setError('Выберите услугу из справочника.');
            return;
        }

        if (!byAgreement) {
            if (!description.trim()) {
                setIsSubmitting(false);
                setError('Добавьте описание услуги.');
                return;
            }

            const parsedPrice = price === '' ? 0 : parseFloat(price);
            const parsedDuration = duration === '' ? 0 : parseInt(duration, 10);

            if (Number.isNaN(parsedPrice) || Number.isNaN(parsedDuration) || parsedPrice < 0 || parsedDuration < 0) {
                setIsSubmitting(false);
                setError('Цена и длительность заполнены некорректно.');
                return;
            }
        }

        const formData = new FormData(e.currentTarget);
        formData.set('title', selectedService);
        formData.set('description', description.trim());
        formData.set('images', JSON.stringify(images));
        formData.set('redirect_on_success', onSaved ? 'false' : 'true');

        if (profileId != null) {
            formData.set('profile_id', profileId.toString());
        }

        if (byAgreement) {
            formData.set('price', '0');
            formData.set('duration', '0');
            formData.set('duration_min', '0');
        } else {
            formData.set('price', price || '0');
            formData.set('duration', duration || '0');
            formData.set('duration_min', duration || '0');
        }

        try {
            if (isEditing && serviceId) {
                const result = await updateService(serviceId, null, formData);
                if (result?.message) {
                    setError(result.message);
                    toast.error(result.message);
                    setIsSubmitting(false);
                    return;
                }

                if (result?.success && result.service) {
                    onSaved?.(result.service);
                }
            } else if (profileId != null) {
                const result = await addService(formData);
                if (!result.success) {
                    setError(result.error || 'Ошибка');
                    toast.error(result.error || 'Ошибка при добавлении услуги');
                    setIsSubmitting(false);
                    return;
                }

                if (result.service) {
                    onSaved?.(result.service);
                }
            } else {
                const result = await createService(null, formData);
                if (result?.message) {
                    setError(result.message);
                    toast.error(result.message);
                    setIsSubmitting(false);
                    return;
                }
            }
        } catch (submitError: any) {
            if (submitError?.message === 'NEXT_REDIRECT' || submitError?.digest?.includes('NEXT_REDIRECT')) {
                return;
            }

            setError(submitError?.message || 'Ошибка');
            toast.error(submitError?.message || 'Ошибка при сохранении услуги');
            setIsSubmitting(false);
            return;
        }

        setIsSubmitting(false);

        if (profileId != null && !isEditing && !onSaved) {
            (e.target as HTMLFormElement).reset();
            setSelectedCategory('');
            setSelectedSubcategory('');
            setSelectedService('');
            setDescription('');
            setImages([]);
            setPrice('');
            setDuration('');
            setByAgreement(false);
            toast.success('Услуга добавлена');
        }
    };

    return (
        <div className={compact || (profileId != null && !isEditing) ? '' : 'min-h-screen flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8'}>
            <div className={compact || (profileId != null && !isEditing) ? '' : 'bg-white p-8 rounded-2xl shadow-xl w-full max-w-lg border border-gray-100'}>
                {!compact && (profileId == null || isEditing) && (
                    <h1 className="text-2xl font-bold mb-2 text-center text-gray-900">
                        {isEditing ? 'Редактировать услугу' : 'Какую услугу вы хотите предложить?'}
                    </h1>
                )}

                <form onSubmit={handleSubmit} className={profileId != null && !isEditing ? 'space-y-3' : 'space-y-6'} noValidate>
                    {error && (
                        <div className="flex items-center gap-2 bg-red-50 text-red-600 px-3 py-2 rounded-lg text-xs">
                            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    <select
                        required
                        value={selectedCategory}
                        onChange={(e) => {
                            setSelectedCategory(e.target.value);
                            setSelectedSubcategory('');
                            setSelectedService('');
                        }}
                        className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all"
                    >
                        <option value="" disabled>Выберите категорию</option>
                        {categoryOptions.map((category) => (
                            <option key={category} value={category}>
                                {category}
                            </option>
                        ))}
                    </select>

                    <select
                        required
                        value={selectedSubcategory}
                        onChange={(e) => {
                            setSelectedSubcategory(e.target.value);
                            setSelectedService('');
                        }}
                        disabled={!selectedCategory}
                        className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all disabled:opacity-60"
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

                    {serviceOptions.length > 1 ? (
                        <select
                            name="title"
                            required
                            value={selectedService}
                            onChange={(e) => setSelectedService(e.target.value)}
                            disabled={!selectedSubcategory}
                            className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all disabled:opacity-60"
                        >
                            <option value="" disabled>
                                Выберите конкретную услугу
                            </option>
                            {serviceOptions.map((service) => (
                                <option key={service} value={service}>
                                    {service}
                                </option>
                            ))}
                        </select>
                    ) : serviceOptions.length === 1 ? (
                        <p className="text-sm text-slate-600 py-1">Услуга: <span className="font-medium">{serviceOptions[0]}</span></p>
                    ) : null}

                    <div className="flex flex-col gap-2">
                        <div className="flex gap-2 items-center flex-wrap">
                            <input
                                name="price"
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="Цена, €"
                                disabled={byAgreement}
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                className="flex-1 min-w-0 h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all disabled:opacity-60 disabled:bg-gray-100"
                            />
                            <input
                                name="duration"
                                type="number"
                                min="0"
                                placeholder="Мин"
                                disabled={byAgreement}
                                value={duration}
                                onChange={(e) => setDuration(e.target.value)}
                                className="w-24 h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all disabled:opacity-60 disabled:bg-gray-100"
                            />
                            <button
                                type="button"
                                onClick={() => setByAgreement((prev) => !prev)}
                                className={`h-10 px-4 rounded-lg text-sm font-medium whitespace-nowrap border transition-all ${
                                    byAgreement
                                        ? 'bg-gray-900 text-white border-gray-900'
                                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                                }`}
                            >
                                по договорённости
                            </button>
                        </div>
                        <p className="text-xs text-gray-500">Цена и время необязательны. Нажмите «по договорённости», если не указываете.</p>
                    </div>

                    <textarea
                        name="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Описание услуги (что входит в процедуру, материалы, особенности)"
                        rows={profileId != null && !isEditing ? 3 : 5}
                        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all"
                    />

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full h-10 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : isEditing ? (
                            <Save className="w-4 h-4" />
                        ) : (
                            <Plus className="w-4 h-4" />
                        )}
                        {isEditing ? 'Сохранить изменения' : 'Добавить услугу'}
                    </button>
                </form>

                {returnHref && !compact && (
                    <div className="mt-6 text-center">
                        <Link href={returnHref} className="text-sm text-gray-500 hover:text-black transition-colors">
                            Вернуться в кабинет
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
