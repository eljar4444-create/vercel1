'use client';

import { createService, updateService } from '@/app/actions/service';
import { uploadServicePhoto } from '@/app/actions/upload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';

import { LocationAutocomplete } from '@/components/LocationAutocomplete';
import { useState } from 'react';


interface CreateServiceFormProps {
    categories: { id: string; name: string; slug: string }[];
    cities: { id: string; name: string; slug: string }[]; // Added slug
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

    // Schedule logic
    const STANDARD_SCHEDULES = ["Ежедневно (Пн-Вс)", "По будням (Пн-Пт)", "Выходные (Сб-Вс)", "2/2", "По договоренности"];
    // Generate time options 00:00 to 23:00
    const TIME_OPTIONS = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);

    const initialSchedule = initialData?.schedule || '';
    const initialTime = initialData?.workTime || '';

    // Parse initial time "HH:mm - HH:mm"
    const parseTimeRange = (range: string) => {
        const parts = range.split(' - ');
        if (parts.length === 2 && TIME_OPTIONS.includes(parts[0]) && TIME_OPTIONS.includes(parts[1])) {
            return { start: parts[0], end: parts[1] };
        }
        return { start: '09:00', end: '18:00' }; // Default
    };

    const initialParsedTime = parseTimeRange(initialTime);

    // Check if initial value is standard or custom
    const isStandardSchedule = !initialSchedule || STANDARD_SCHEDULES.includes(initialSchedule);

    // State

    const DAYS = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье"];
    const shortDays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

    // Parse initial schedule "Day - Day"
    const parseScheduleRange = (range: string) => {
        const parts = range.split(' - ');
        // Check if using short names
        if (parts.length === 2 && shortDays.includes(parts[0]) && shortDays.includes(parts[1])) {
            return { start: parts[0], end: parts[1] };
        }
        return { start: 'Пн', end: 'Пт' }; // Default
    };

    const initialParsedSchedule = parseScheduleRange(initialSchedule);

    const [scheduleMode, setScheduleMode] = useState<'standard' | 'custom'>(isStandardSchedule ? 'standard' : 'custom');
    const [scheduleValue, setScheduleValue] = useState(`${initialParsedSchedule.start} - ${initialParsedSchedule.end}`);
    const [dayStart, setDayStart] = useState(initialParsedSchedule.start);
    const [dayEnd, setDayEnd] = useState(initialParsedSchedule.end);

    const updateSchedule = (start: string, end: string) => {
        setScheduleValue(`${start} - ${end}`);
    };

    // Time State
    const [timeStart, setTimeStart] = useState(initialParsedTime.start);
    const [timeEnd, setTimeEnd] = useState(initialParsedTime.end);
    const [timeValue, setTimeValue] = useState(`${initialParsedTime.start} - ${initialParsedTime.end}`);

    const handleScheduleChange = (val: string) => {
        if (val === 'custom') {
            setScheduleMode('custom');
            if (STANDARD_SCHEDULES.includes(scheduleValue)) setScheduleValue('');
        } else {
            setScheduleMode('standard');
            setScheduleValue(val);
        }
    };

    const updateWorkTime = (start: string, end: string) => {
        setTimeValue(`${start} - ${end}`);
    };

    // Subcategory State
    // Parse initial subcategories (comma separated)
    const initialSubcategoriesRaw = initialData?.subcategory ? initialData.subcategory.split(',').map(s => s.trim()) : [];

    // Mode: Array of objects { value: string, isCustom: boolean }
    // If we have existing data, we need to determine if it's custom or not.
    // However, if we change category, we clear this anyway.

    // Helper to init state
    const initSubStates = () => {
        if (!initialData?.subcategory) return [];

        try {
            // Try parsing as JSON (New format)
            const parsed = JSON.parse(initialData.subcategory);
            if (Array.isArray(parsed)) {
                return parsed.map((item: any) => ({
                    value: item.name || '',
                    isCustom: item.isCustom ?? false,
                    price: item.price || '',
                    priceType: item.priceType || 'fixed'
                }));
            }
        } catch (e) {
            // Fallback to legacy comma-separated string
        }

        const raw = initialData.subcategory.split(',').map(s => s.trim());
        const known = initialCategory?.slug && SUBCATEGORIES[initialCategory.slug] ? SUBCATEGORIES[initialCategory.slug] : [];
        return raw.map(s => ({
            value: s,
            isCustom: !known.includes(s),
            price: '',
            priceType: 'fixed'
        }));
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
        setSubcategoryItems([]); // Reset
    };

    // Derived joined string for form submission (JSON now)
    const subcategoryJoinedValue = JSON.stringify(subcategoryItems.map(i => ({
        name: i.value.trim(),
        isCustom: i.isCustom,
        price: i.price,
        priceType: i.priceType
    })).filter(i => i.name));

    // Photo State
    const [uploadedPhotos, setUploadedPhotos] = useState<string[]>(initialData?.photos?.map(p => p.url) || []);

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

    const formAction = isEditing ? updateService.bind(null, serviceId) : createService;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
            <Link href="/" className="flex items-center gap-2 mb-8">
                {/* Logo removed */}
            </Link>

            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-lg border border-gray-100">
                <h1 className="text-2xl font-bold mb-2 text-center text-gray-900">{isEditing ? 'Редактировать услугу' : 'Какую услугу вы хотите предложить?'}</h1>
                <p className="text-gray-500 text-center mb-8">{isEditing ? 'Внесите изменения в вашу услугу' : 'Опишите вашу услугу, чтобы найти клиентов'}</p>

                <form action={formAction} className="space-y-6">
                    {/* Title hidden, auto-generated */}
                    <input type="hidden" name="title" value={selectedCategorySlug ? `${categories.find(c => c.slug === selectedCategorySlug)?.name} ${initialData?.subcategory ? `- ${initialData.subcategory}` : ''}` : 'Новая услуга'} />

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Категория <span className="text-red-500">*</span></label>
                        <select
                            name="categoryId"
                            required
                            defaultValue={initialData?.categoryId || ""}
                            className="w-full h-11 px-3 bg-gray-50 border border-gray-200 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-black transition-all text-sm"
                            onChange={(e) => {
                                const category = categories.find(c => c.id === e.target.value);
                                handleCategoryChange(category?.slug || '');
                            }}
                        >
                            <option value="" disabled>Выберите категорию</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>

                    {selectedCategorySlug && SUBCATEGORIES[selectedCategorySlug] && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Подкатегория <span className="text-red-500">*</span></label>
                            <div className="space-y-3">
                                {subcategoryItems.map((item, index) => (
                                    <div key={index} className="flex flex-col gap-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
                                        <div className="flex items-center gap-2">
                                            <div className="flex-grow">
                                                {item.isCustom ? (
                                                    <div className="relative">
                                                        <Input
                                                            placeholder="Напишите вашу подкатегорию"
                                                            value={item.value}
                                                            onChange={(e) => updateSubcategoryItem(index, 'value', e.target.value)}
                                                            className="bg-white border-gray-200 h-11 focus:bg-white transition-all pr-8"
                                                            autoFocus
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => updateSubcategoryItem(index, 'isCustom', false)}
                                                            className="absolute right-2 top-0 bottom-0 text-gray-400 hover:text-black text-xs px-2"
                                                            title="Выбрать из списка"
                                                        >
                                                            Список
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <select
                                                        className="w-full h-11 px-3 bg-white border border-gray-200 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-black transition-all text-sm"
                                                        value={item.value === '' ? '' : item.value}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            if (val === 'custom') {
                                                                updateSubcategoryItem(index, 'isCustom', true);
                                                            } else {
                                                                updateSubcategoryItem(index, 'value', val);
                                                            }
                                                        }}
                                                    >
                                                        <option value="" disabled>Выберите подкатегорию</option>
                                                        {SUBCATEGORIES[selectedCategorySlug].map(sub => (
                                                            <option key={sub} value={sub}>{sub}</option>
                                                        ))}
                                                        <option value="custom">Другое (вписать вручную)...</option>
                                                    </select>
                                                )}
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => removeSubcategoryItem(index)}
                                                className="h-11 w-11 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                            >
                                                ✕
                                            </button>
                                        </div>

                                        {/* Price Section for Subcategory */}
                                        <div className="flex flex-col md:flex-row gap-2 items-start md:items-center pl-1">
                                            <div className="flex items-center gap-2">
                                                <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer whitespace-nowrap">
                                                    <input
                                                        type="checkbox"
                                                        checked={item.priceType === 'agreement'}
                                                        onChange={(e) => updateSubcategoryItem(index, 'priceType', e.target.checked ? 'agreement' : 'fixed')}
                                                        className="rounded border-gray-300 text-black focus:ring-black"
                                                    />
                                                    По договоренности
                                                </label>

                                                {item.priceType !== 'agreement' && (
                                                    <div className="relative w-32">
                                                        <Input
                                                            type="number"
                                                            placeholder="Цена"
                                                            value={item.price}
                                                            onChange={(e) => updateSubcategoryItem(index, 'price', e.target.value)}
                                                            className="w-full border-gray-200 h-9 text-sm pr-6 bg-white"
                                                        />
                                                        <span className="absolute right-2 top-2 text-gray-400 text-xs">€</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                <Button
                                    type="button"
                                    onClick={addSubcategoryItem}
                                    variant="outline"
                                    className="w-full h-11 border-dashed border-gray-300 text-gray-600 hover:text-black hover:border-black"
                                >
                                    + Добавить подкатегорию
                                </Button>
                                <input type="hidden" name="subcategory" value={subcategoryJoinedValue} />
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
                            className="h-32 bg-gray-50 border-gray-200 focus:bg-white transition-all resize-none"
                        />
                    </div>

                    {/* Photos Section */}
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
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                                    </button>
                                </div>
                            ))}

                            {/* New Upload Button */}
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
                        <p className="text-xs text-gray-400">Загрузите примеры ваших работ (до 10 фото).</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Опыт работы (лет)</label>
                            <Input
                                name="experience"
                                type="number"
                                placeholder="Например: 3"
                                min="0"
                                defaultValue={initialData?.experience ?? ''}
                                className="bg-gray-50 border-gray-200 h-11 focus:bg-white transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Где оказываете услугу? <span className="text-red-500">*</span></label>
                            <div className="flex flex-col gap-2 p-3 bg-gray-50 border border-gray-200 rounded-md">
                                {['У клиента', 'У себя', 'Дистанционно'].map(type => (
                                    <label key={type} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            name="locationType"
                                            value={type}
                                            defaultChecked={initialData?.locationType?.includes(type)}
                                            className="rounded border-gray-300 text-black focus:ring-black"
                                        />
                                        {type}
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Additional Services Section */}
                    <div className="space-y-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Дополнительные услуги</label>
                        <p className="text-xs text-gray-500 mb-3">Добавьте список услуг. Вы можете указать цену или выбрать "По договоренности".</p>

                        {priceListItems.map((item, index) => (
                            <div key={index} className="flex flex-col md:flex-row gap-2 items-start md:items-center bg-white p-2 rounded-md border border-gray-100">
                                <Input
                                    placeholder="Название услуги"
                                    value={item.description}
                                    onChange={(e) => updatePriceItem(index, 'description', e.target.value)}
                                    className="flex-grow border-transparent focus:border-gray-200 h-10 text-sm p-0 px-2"
                                />

                                <div className="flex items-center gap-2">
                                    <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer whitespace-nowrap">
                                        <input
                                            type="checkbox"
                                            checked={item.price === 'agreement'}
                                            onChange={(e) => updatePriceItem(index, 'price', e.target.checked ? 'agreement' : '')}
                                            className="rounded border-gray-300 text-black focus:ring-black"
                                        />
                                        По договоренности
                                    </label>

                                    {item.price !== 'agreement' && (
                                        <div className="relative w-24">
                                            <Input
                                                type="number"
                                                placeholder="Цена"
                                                value={item.price}
                                                onChange={(e) => updatePriceItem(index, 'price', e.target.value)}
                                                className="w-full border-gray-200 h-9 text-sm pr-6"
                                            />
                                            <span className="absolute right-2 top-2 text-gray-400 text-xs">€</span>
                                        </div>
                                    )}
                                </div>

                                <button
                                    type="button"
                                    onClick={() => removePriceItem(index)}
                                    className="h-8 w-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors ml-auto md:ml-0"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}

                        <Button
                            type="button"
                            onClick={addPriceItem}
                            variant="outline"
                            className="w-full h-10 border-dashed border-gray-300 text-gray-600 hover:text-black hover:border-black"
                        >
                            + Добавить услугу
                        </Button>
                        <input type="hidden" name="priceList" value={JSON.stringify(priceListItems)} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Дни работы <span className="text-red-500">*</span></label>

                            <div className="flex items-center gap-2">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-md px-3 h-11">
                                        <span className="text-gray-500 text-sm">с</span>
                                        <select
                                            className="bg-transparent w-full focus:outline-none text-sm"
                                            value={dayStart}
                                            onChange={(e) => {
                                                setDayStart(e.target.value);
                                                updateSchedule(e.target.value, dayEnd);
                                            }}
                                        >
                                            <option value="" disabled>День</option>
                                            {shortDays.map(d => (
                                                <option key={`start-${d}`} value={d}>{d}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-md px-3 h-11">
                                        <span className="text-gray-500 text-sm">по</span>
                                        <select
                                            className="bg-transparent w-full focus:outline-none text-sm"
                                            value={dayEnd}
                                            onChange={(e) => {
                                                setDayEnd(e.target.value);
                                                updateSchedule(dayStart, e.target.value);
                                            }}
                                        >
                                            <option value="" disabled>День</option>
                                            {shortDays.map(d => (
                                                <option key={`end-${d}`} value={d}>{d}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <input type="hidden" name="schedule" value={scheduleValue} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Время работы <span className="text-red-500">*</span></label>

                            <div className="flex items-center gap-2">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-md px-3 h-11">
                                        <span className="text-gray-500 text-sm">с</span>
                                        <select
                                            className="bg-transparent w-full focus:outline-none text-sm"
                                            value={timeStart}
                                            onChange={(e) => {
                                                setTimeStart(e.target.value);
                                                updateWorkTime(e.target.value, timeEnd);
                                            }}
                                        >
                                            <option value="" disabled>--:--</option>
                                            {TIME_OPTIONS.map(t => (
                                                <option key={`start-${t}`} value={t}>{t}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-md px-3 h-11">
                                        <span className="text-gray-500 text-sm">по</span>
                                        <select
                                            className="bg-transparent w-full focus:outline-none text-sm"
                                            value={timeEnd}
                                            onChange={(e) => {
                                                setTimeEnd(e.target.value);
                                                updateWorkTime(timeStart, e.target.value);
                                            }}
                                        >
                                            <option value="" disabled>--:--</option>
                                            {TIME_OPTIONS.map(t => (
                                                <option key={`end-${t}`} value={t}>{t}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <input type="hidden" name="workTime" value={timeValue} />
                        </div>
                    </div>

                    <input type="hidden" name="price" value="0" />

                    <input type="hidden" name="cityId" value={autoCityId} />

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Местоположение (на карте)</label>
                        <LocationAutocomplete
                            onSelect={(addr, lat, lng) => {
                                setCoordinates({ lat, lng });

                                // Auto-detect city from address string
                                const lowerAddr = addr.toLowerCase();

                                // Check if it's Germany
                                const isGermany = lowerAddr.includes('germany') || lowerAddr.includes('германия') || lowerAddr.includes('deutschland');

                                // Try to match existing cities first
                                const matchedCity = cities.find(c =>
                                    lowerAddr.includes(c.slug.toLowerCase()) ||
                                    lowerAddr.includes(c.name.toLowerCase())
                                );

                                if (matchedCity) {
                                    setAutoCityId(matchedCity.id);
                                    // Clear custom detected name if we found a match
                                    // (Actually we can leave it empty or use matched name, but ID is enough)
                                } else if (isGermany) {
                                    // If in Germany but not in list, try to extract city name
                                    // Simple heuristic: First part of address? Or look for comma?
                                    // Usually "City, Country" or "Street, City, Country"
                                    const parts = addr.split(',');
                                    let extractedName = parts[0].trim();
                                    if (parts.length > 1) {
                                        // Heuristic: If multiple parts, usually City is 2nd to last or just before Country?
                                        // Let's simplified: If 2 parts: "City, Country". If 3: "Street, City, Country".
                                        // Let's try to grab the first part that is NOT the formatted address suffix.
                                        // Actually, for simplicity, let's just claim the *first* part is the city if simplistic, 
                                        // or better, pass the whole address and let backend figure it out? 
                                        // Let's try grabbing the first component from the string as a fallback.
                                        extractedName = parts[0].trim();
                                    }
                                    // We will send this as a "New City" candidate
                                    setAutoCityId('NEW_CITY'); // Marker
                                    // We'll add a hidden input.
                                    setCustomCityName(extractedName);
                                } else {
                                    console.log('City not detected from address. Address:', addr);
                                    setAutoCityId('');
                                }
                            }}
                            className="bg-gray-50 border-gray-200 h-11 focus:bg-white transition-all"
                        />
                        <input type="hidden" name="latitude" value={coordinates.lat || ''} />
                        <input type="hidden" name="longitude" value={coordinates.lng || ''} />
                        <input type="hidden" name="customCityName" value={customCityName} />

                        {coordinates.lat && (
                            <div className="mt-2 text-sm">
                                {autoCityId && autoCityId !== 'NEW_CITY' ? (
                                    <span className="text-green-600 font-medium">
                                        ✓ Город определен: {cities.find(c => c.id === autoCityId)?.name}
                                    </span>
                                ) : autoCityId === 'NEW_CITY' ? (
                                    <span className="text-green-600 font-medium">
                                        ✓ Местоположение принято (Германия)
                                    </span>
                                ) : (
                                    <span className="text-red-500 font-medium">
                                        ⚠ Мы работаем только в Германии. Пожалуйста, выберите город в Германии.
                                    </span>
                                )}
                            </div>
                        )}
                        {/* Show saved location hint */}
                        {isEditing && !coordinates.lat && initialData?.latitude && (
                            <p className="text-xs text-gray-400 mt-1">Оставьте пустым, чтобы не менять текущее местоположение.</p>
                        )}
                        {isEditing && (
                            <input type="hidden" name="latitude" value={coordinates.lat ?? initialData?.latitude ?? ''} />
                        )}
                        {isEditing && (
                            <input type="hidden" name="longitude" value={coordinates.lng ?? initialData?.longitude ?? ''} />
                        )}
                    </div>

                    <Button type="submit" className="w-full h-12 text-base bg-[#fc0] hover:bg-[#e6b800] text-black font-bold rounded-xl shadow-none">
                        {isEditing ? 'Сохранить изменения' : 'Опубликовать'}
                    </Button>
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
