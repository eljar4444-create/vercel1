'use client';

import { useMemo, useState, useEffect } from 'react';
import { Plus, Loader2, AlertCircle, Upload, X } from 'lucide-react';
import { addService } from '@/app/actions/services';
import { uploadServicePhoto } from '@/app/actions/upload';
import toast from 'react-hot-toast';
import { BEAUTY_SERVICES } from '@/lib/constants/services-taxonomy';

interface AddServiceFormProps {
    profileId: number;
}

export function AddServiceForm({ profileId }: AddServiceFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedSubcategory, setSelectedSubcategory] = useState('');
    const [selectedService, setSelectedService] = useState('');
    const [description, setDescription] = useState('');
    const [images, setImages] = useState<string[]>([]);
    const [byAgreement, setByAgreement] = useState(false);

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

    const handleUploadImages = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        setIsUploading(true);
        try {
            let currentCount = images.length;
            for (const file of Array.from(files)) {
                if (currentCount >= 10) {
                    toast.error('Можно загрузить максимум 10 фото.');
                    break;
                }
                const payload = new FormData();
                payload.append('photo', file);
                const result = await uploadServicePhoto(payload);
                if (result.success && result.imageUrl) {
                    currentCount += 1;
                    setImages((prev) => [...prev, result.imageUrl]);
                }
            }
        } catch (uploadError: any) {
            toast.error(uploadError?.message || 'Не удалось загрузить фото');
        } finally {
            setIsUploading(false);
            event.target.value = '';
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        if (!selectedService) {
            setIsSubmitting(false);
            setError('Выберите услугу из справочника.');
            return;
        }

        const formData = new FormData(e.currentTarget);
        formData.set('profile_id', profileId.toString());
        formData.set('title', selectedService);
        formData.set('description', description.trim());
        formData.set('images', JSON.stringify(images));

        if (byAgreement) {
            formData.set('price', '0');
            formData.set('duration', '0');
        }

        const result = await addService(formData);

        setIsSubmitting(false);

        if (result.success) {
            (e.target as HTMLFormElement).reset();
            setSelectedCategory('');
            setSelectedSubcategory('');
            setSelectedService('');
            setDescription('');
            setImages([]);
            setByAgreement(false);
            toast.success('Услуга добавлена');
        } else {
            setError(result.error || 'Ошибка');
            toast.error(result.error || 'Ошибка при добавлении услуги');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
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
                        className="flex-1 min-w-0 h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all disabled:opacity-60 disabled:bg-gray-100"
                    />
                    <input
                        name="duration"
                        type="number"
                        min="0"
                        placeholder="Мин"
                        disabled={byAgreement}
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
                rows={3}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all"
            />

            <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Фотографии работ по услуге</label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {images.map((url, idx) => (
                        <div key={`${url}-${idx}`} className="group relative aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
                            <img src={url} alt={`service-work-${idx + 1}`} className="h-full w-full object-cover" />
                            <button
                                type="button"
                                onClick={() => setImages((prev) => prev.filter((_, i) => i !== idx))}
                                className="absolute right-1 top-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/65 text-white opacity-0 transition group-hover:opacity-100"
                                aria-label="Удалить фото"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    ))}
                    <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 text-gray-500 hover:border-gray-400">
                        {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        <span className="mt-1 text-[11px]">Добавить</span>
                        <input type="file" accept="image/*" multiple className="hidden" onChange={handleUploadImages} disabled={isUploading || images.length >= 10} />
                    </label>
                </div>
                <p className="text-xs text-gray-500">До 10 фото ({images.length}/10)</p>
            </div>

            <button
                type="submit"
                disabled={isSubmitting || isUploading}
                className="w-full h-10 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
                {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                    <Plus className="w-4 h-4" />
                )}
                Добавить услугу
            </button>
        </form>
    );
}
