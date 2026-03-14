'use client';

import { useMemo, useState } from 'react';
import { Camera, Check, Loader2, Plus, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { createProviderProfile } from '@/app/actions/providerOnboarding';
import { addService } from '@/app/actions/services';
import { updateSchedule } from '@/app/actions/updateSchedule';
import { updateProfile } from '@/app/actions/updateProfile';
import { uploadAvatar } from '@/app/actions/uploadAvatar';
import { uploadServicePhoto } from '@/app/actions/upload';
import { completeOnboarding as completeOnboardingStatus } from '@/app/actions/updateOnboardingStatus';
import type { OnboardingCategoryOption } from '@/app/actions/onboardingCategories';
import { getGermanCitySuggestions } from '@/constants/searchSuggestions';
import {
    BEAUTY_SERVICES,
    BEAUTY_SERVICE_TITLES,
    isBeautyServiceTitle,
} from '@/lib/constants/services-taxonomy';
import {
    normalizeProviderLanguage,
    PROVIDER_LANGUAGE_OPTIONS,
    type ProviderLanguage,
} from '@/lib/provider-languages';

type FlowType = 'INDIVIDUAL' | 'SALON';
type StepNumber = 1 | 2 | 3 | 4 | 5;
type DayId = 1 | 2 | 3 | 4 | 5 | 6 | 0;
type ProviderTypePayload = 'INDIVIDUAL' | 'SALON';
type WorkFormat = 'home' | 'visit' | 'rent';
type ExperienceValue = 'lt1' | '1to3' | '3to7' | '7plus';
type AudienceValue = 'women' | 'men' | 'kids';

type StepDay = {
    enabled: boolean;
    start: string;
    end: string;
};

type PhotoSlot = {
    file: File | null;
    previewUrl: string | null;
};

type WizardState = {
    step1: {
        profileName: string;
        bio: string;
        managerName: string;
        avatarFile: File | null;
        avatarPreviewUrl: string | null;
    };
    step2: {
        categoryIds: string[];
        languages: ProviderLanguage[];
        experience: ExperienceValue | '';
        audiences: AudienceValue[];
    };
    step3: {
        city: string;
        address: string;
        zipCode: string;
        isHomeBased: boolean;
        workFormat: WorkFormat[];
        hideExactAddress: boolean;
        travelRadiusKm: string;
        salonName: string;
    };
    step4: {
        title: string;
        price: string;
        duration: string;
        description: string;
        workPhotos: [PhotoSlot, PhotoSlot, PhotoSlot];
    };
    step5: Record<DayId, StepDay>;
};

type InitialProfile = {
    id: number;
    name: string;
    bio: string | null;
    city: string;
    address: string | null;
    providerType: 'SALON' | 'PRIVATE' | 'INDIVIDUAL';
    categoryId: number;
    languages: string[];
    imageUrl?: string | null;
};

type ServiceDefaults = Record<string, { price: number; duration: number }>;

type MasterOnboardingWizardProps = {
    userName: string;
    flowType?: FlowType;
    categories: OnboardingCategoryOption[];
    serviceDefaults: ServiceDefaults;
    initialProfile: InitialProfile | null;
};

const SALON_DURATION_OPTIONS = [30, 45, 60, 90, 120];
const INDIVIDUAL_DURATION_OPTIONS = [15, 30, 45, 60, 90, 120, 180];
const TRAVEL_RADIUS_OPTIONS = [5, 10, 20, 30, 50];
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const BIO_QUICK_TAGS = [
    '8 лет опыта',
    'Принимаю на дому',
    'Выезд к клиенту',
    'Работаю с детьми',
    'Только натуральные материалы',
];

const EXPERIENCE_OPTIONS: Array<{ value: ExperienceValue; label: string }> = [
    { value: 'lt1', label: 'До 1 года' },
    { value: '1to3', label: '1-3 года' },
    { value: '3to7', label: '3-7 лет' },
    { value: '7plus', label: '7+ лет' },
];

const AUDIENCE_OPTIONS: Array<{ value: AudienceValue; icon: string; label: string }> = [
    { value: 'women', icon: '👩', label: 'Женщины' },
    { value: 'men', icon: '👨', label: 'Мужчины' },
    { value: 'kids', icon: '👧', label: 'Дети' },
];

const WORK_FORMAT_OPTIONS: Array<{ value: WorkFormat; title: string; icon: string; subtitle?: string }> = [
    { value: 'home', title: 'У себя дома', icon: '🏠' },
    { value: 'visit', title: 'Выезжаю к клиенту', icon: '🚗' },
    { value: 'rent', title: 'Арендую кресло', subtitle: 'в салоне', icon: '✂️' },
];

const WORK_FORMAT_LABELS: Record<WorkFormat, string> = {
    home: 'У себя дома',
    visit: 'Выезд к клиенту',
    rent: 'Арендую кресло в салоне',
};

const DAYS: Array<{ id: DayId; label: string }> = [
    { id: 1, label: 'Пн' },
    { id: 2, label: 'Вт' },
    { id: 3, label: 'Ср' },
    { id: 4, label: 'Чт' },
    { id: 5, label: 'Пт' },
    { id: 6, label: 'Сб' },
    { id: 0, label: 'Вс' },
];

const STEP_META: Record<FlowType, Record<StepNumber, { label: string; title: string; subtitle?: string }>> = {
    INDIVIDUAL: {
        1: {
            label: 'Давайте познакомимся',
            title: 'Как вас зовут?',
            subtitle: 'Это увидят клиенты на вашем профиле',
        },
        2: {
            label: 'Ваша специализация',
            title: 'Чем вы занимаетесь?',
        },
        3: {
            label: 'Как и где вы работаете?',
            title: 'Где вы принимаете клиентов?',
        },
        4: {
            label: 'Ваша первая услуга',
            title: 'Добавьте услугу',
            subtitle: 'Вы добавите больше услуг позже в кабинете',
        },
        5: {
            label: 'Ваш график',
            title: 'Когда вы принимаете клиентов?',
        },
    },
    SALON: {
        1: {
            label: 'Ваш салон',
            title: 'Название вашего салона',
        },
        2: {
            label: 'Услуги салона',
            title: 'Что предлагает ваш салон?',
            subtitle: 'Выберите все подходящие категории',
        },
        3: {
            label: 'Адрес салона',
            title: 'Где находится ваш салон?',
            subtitle: 'Клиенты будут видеть точный адрес на карте',
        },
        4: {
            label: 'Первая услуга салона',
            title: 'Добавьте услугу',
        },
        5: {
            label: 'График работы',
            title: 'Часы работы салона',
        },
    },
};

const CATEGORY_KEYWORDS: Array<{ taxonomyCategory: keyof typeof BEAUTY_SERVICES; keywords: string[] }> = [
    {
        taxonomyCategory: 'Волосы',
        keywords: ['волос', 'hair', 'barber', 'стриж', 'парикмах', 'окраш'],
    },
    {
        taxonomyCategory: 'Ногти',
        keywords: ['ногт', 'nail', 'маник', 'педик'],
    },
    {
        taxonomyCategory: 'Лицо (Брови и Ресницы)',
        keywords: ['бров', 'ресниц', 'lash', 'brow', 'лицо'],
    },
    {
        taxonomyCategory: 'Тело и Массаж',
        keywords: ['массаж', 'тело', 'эпил', 'депил', 'body'],
    },
    {
        taxonomyCategory: 'Макияж и Стиль',
        keywords: ['макияж', 'makeup', 'стиль', 'style'],
    },
];

const BEAUTY_CATEGORY_TITLES: Record<string, string[]> = Object.entries(BEAUTY_SERVICES).reduce(
    (acc, [categoryName, subgroups]) => {
        acc[categoryName] = Object.values(subgroups).flatMap((services) => services);
        return acc;
    },
    {} as Record<string, string[]>
);

const EMPTY_PHOTO_SLOT: PhotoSlot = { file: null, previewUrl: null };

function parseTimeToMinutes(time: string) {
    const [hours, minutes] = time.split(':').map((value) => Number(value));
    if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null;
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
    return hours * 60 + minutes;
}

function minutesToTime(totalMinutes: number) {
    const safe = Math.max(0, Math.min(23 * 60 + 59, totalMinutes));
    const hours = Math.floor(safe / 60);
    const minutes = safe % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function createDefaultDayState(flowType: FlowType): Record<DayId, StepDay> {
    if (flowType === 'SALON') {
        return {
            1: { enabled: true, start: '10:00', end: '20:00' },
            2: { enabled: true, start: '10:00', end: '20:00' },
            3: { enabled: true, start: '10:00', end: '20:00' },
            4: { enabled: true, start: '10:00', end: '20:00' },
            5: { enabled: true, start: '10:00', end: '20:00' },
            6: { enabled: true, start: '10:00', end: '20:00' },
            0: { enabled: false, start: '10:00', end: '20:00' },
        };
    }

    return {
        1: { enabled: true, start: '09:00', end: '18:00' },
        2: { enabled: true, start: '09:00', end: '18:00' },
        3: { enabled: true, start: '09:00', end: '18:00' },
        4: { enabled: true, start: '09:00', end: '18:00' },
        5: { enabled: true, start: '09:00', end: '18:00' },
        6: { enabled: false, start: '09:00', end: '18:00' },
        0: { enabled: false, start: '09:00', end: '18:00' },
    };
}

function normalizeLanguages(values: string[]): ProviderLanguage[] {
    const normalized = values
        .map((value) => normalizeProviderLanguage(value))
        .filter((value): value is ProviderLanguage => value !== null);

    return Array.from(new Set(normalized));
}

function resolveBeautyCategory(option: OnboardingCategoryOption | null): keyof typeof BEAUTY_SERVICES | null {
    if (!option) return null;
    const haystack = `${option.name} ${option.slug}`.toLowerCase();

    for (const item of CATEGORY_KEYWORDS) {
        if (item.keywords.some((keyword) => haystack.includes(keyword))) {
            return item.taxonomyCategory;
        }
    }

    return null;
}

function nearestDuration(target: number, options: number[]) {
    if (options.length === 0) return 60;
    return options.reduce((closest, current) => {
        const currentDiff = Math.abs(current - target);
        const closestDiff = Math.abs(closest - target);
        return currentDiff < closestDiff ? current : closest;
    }, options[0]);
}

function isAllowedImageType(file: File) {
    return ALLOWED_IMAGE_TYPES.includes(file.type);
}

export function MasterOnboardingWizard({
    userName,
    flowType = 'INDIVIDUAL',
    categories,
    serviceDefaults,
    initialProfile,
}: MasterOnboardingWizardProps) {
    const safeFlowType: FlowType = flowType === 'SALON' ? 'SALON' : 'INDIVIDUAL';
    const router = useRouter();
    const { data: session, update } = useSession();
    const [currentStep, setCurrentStep] = useState<StepNumber>(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [showServiceSuggestions, setShowServiceSuggestions] = useState(false);
    const [showCitySuggestions, setShowCitySuggestions] = useState(false);

    const [wizard, setWizard] = useState<WizardState>(() => ({
        step1: {
            profileName: initialProfile?.name || userName || '',
            bio: initialProfile?.bio || '',
            managerName: userName || '',
            avatarFile: null,
            avatarPreviewUrl: initialProfile?.imageUrl || null,
        },
        step2: {
            categoryIds: initialProfile?.categoryId ? [String(initialProfile.categoryId)] : [],
            languages: initialProfile ? normalizeLanguages(initialProfile.languages) : [],
            experience: '',
            audiences: [],
        },
        step3: {
            city: initialProfile?.city || '',
            address: initialProfile?.address || '',
            zipCode: '',
            isHomeBased: true,
            workFormat: [],
            hideExactAddress: true,
            travelRadiusKm: '10',
            salonName: '',
        },
        step4: {
            title: '',
            price: '',
            duration: '60',
            description: '',
            workPhotos: [EMPTY_PHOTO_SLOT, EMPTY_PHOTO_SLOT, EMPTY_PHOTO_SLOT],
        },
        step5: createDefaultDayState(safeFlowType),
    }));

    const stepMeta = STEP_META[safeFlowType][currentStep];
    const activeDays = useMemo(() => DAYS.filter((day) => wizard.step5[day.id].enabled), [wizard.step5]);
    const selectedPrimaryCategoryId = wizard.step2.categoryIds[0] || '';
    const selectedPrimaryCategory = useMemo(
        () => categories.find((category) => String(category.id) === selectedPrimaryCategoryId) || null,
        [categories, selectedPrimaryCategoryId]
    );
    const mappedBeautyCategory = useMemo(
        () => resolveBeautyCategory(selectedPrimaryCategory),
        [selectedPrimaryCategory]
    );

    const categoryServiceCatalog = useMemo(() => {
        if (safeFlowType !== 'INDIVIDUAL') return BEAUTY_SERVICE_TITLES;
        if (!mappedBeautyCategory) return BEAUTY_SERVICE_TITLES;
        return BEAUTY_CATEGORY_TITLES[mappedBeautyCategory] || BEAUTY_SERVICE_TITLES;
    }, [mappedBeautyCategory, safeFlowType]);

    const filteredServiceSuggestions = useMemo(() => {
        const query = wizard.step4.title.trim().toLowerCase();
        const source = query
            ? categoryServiceCatalog.filter((title) => title.toLowerCase().includes(query))
            : categoryServiceCatalog;
        return source.slice(0, 40);
    }, [categoryServiceCatalog, wizard.step4.title]);

    const citySuggestions = useMemo(() => {
        if (safeFlowType !== 'INDIVIDUAL') return [];
        return getGermanCitySuggestions(wizard.step3.city, 8);
    }, [safeFlowType, wizard.step3.city]);

    const validActiveDayTimes = useMemo(
        () =>
            activeDays.every((day) => {
                const start = parseTimeToMinutes(wizard.step5[day.id].start);
                const end = parseTimeToMinutes(wizard.step5[day.id].end);
                return start !== null && end !== null && end > start;
            }),
        [activeDays, wizard.step5]
    );

    const parsedPrice = wizard.step4.price.trim() === '' ? Number.NaN : Number(wizard.step4.price);
    const validServiceTitle = isBeautyServiceTitle(wizard.step4.title.trim());

    const isStep1Valid = safeFlowType === 'SALON'
        ? wizard.step1.profileName.trim().length > 0 &&
            wizard.step1.bio.trim().length > 0 &&
            wizard.step1.managerName.trim().length > 0
        : wizard.step1.profileName.trim().length > 0;

    const isStep2Valid = safeFlowType === 'SALON'
        ? wizard.step2.categoryIds.length > 0 && wizard.step2.languages.length > 0
        : wizard.step2.categoryIds.length > 0;

    const isStep3Valid = safeFlowType === 'SALON'
        ? wizard.step3.city.trim().length > 0 &&
            wizard.step3.address.trim().length > 0 &&
            wizard.step3.zipCode.trim().length > 0
        : wizard.step3.city.trim().length > 0;

    const isStep4Valid = safeFlowType === 'SALON'
        ? validServiceTitle &&
            wizard.step4.duration.trim().length > 0 &&
            wizard.step4.price.trim().length > 0 &&
            !Number.isNaN(parsedPrice) &&
            parsedPrice >= 0
        : wizard.step4.title.trim().length > 0 &&
            wizard.step4.price.trim().length > 0 &&
            !Number.isNaN(parsedPrice) &&
            parsedPrice >= 0;

    const isStep5Valid = activeDays.length > 0 && validActiveDayTimes;

    const canGoNext = useMemo(() => {
        if (currentStep === 1) return isStep1Valid;
        if (currentStep === 2) return isStep2Valid;
        if (currentStep === 3) return isStep3Valid;
        if (currentStep === 4) return isStep4Valid;
        return false;
    }, [currentStep, isStep1Valid, isStep2Valid, isStep3Valid, isStep4Valid]);

    const updateStep1 = (patch: Partial<WizardState['step1']>) => {
        setWizard((prev) => ({
            ...prev,
            step1: {
                ...prev.step1,
                ...patch,
            },
        }));
    };

    const updateStep2 = (patch: Partial<WizardState['step2']>) => {
        setWizard((prev) => ({
            ...prev,
            step2: {
                ...prev.step2,
                ...patch,
            },
        }));
    };

    const updateStep3 = (patch: Partial<WizardState['step3']>) => {
        setWizard((prev) => ({
            ...prev,
            step3: {
                ...prev.step3,
                ...patch,
            },
        }));
    };

    const updateStep4 = (patch: Partial<WizardState['step4']>) => {
        setWizard((prev) => ({
            ...prev,
            step4: {
                ...prev.step4,
                ...patch,
            },
        }));
    };

    const toggleLanguage = (language: ProviderLanguage) => {
        setWizard((prev) => {
            const exists = prev.step2.languages.includes(language);
            const languages = exists
                ? prev.step2.languages.filter((value) => value !== language)
                : [...prev.step2.languages, language];

            return {
                ...prev,
                step2: {
                    ...prev.step2,
                    languages,
                },
            };
        });
    };

    const toggleAudience = (audience: AudienceValue) => {
        setWizard((prev) => {
            const exists = prev.step2.audiences.includes(audience);
            const audiences = exists
                ? prev.step2.audiences.filter((value) => value !== audience)
                : [...prev.step2.audiences, audience];

            return {
                ...prev,
                step2: {
                    ...prev.step2,
                    audiences,
                },
            };
        });
    };

    const toggleWorkFormat = (value: WorkFormat) => {
        setWizard((prev) => {
            const exists = prev.step3.workFormat.includes(value);
            const workFormat = exists
                ? prev.step3.workFormat.filter((item) => item !== value)
                : [...prev.step3.workFormat, value];

            return {
                ...prev,
                step3: {
                    ...prev.step3,
                    workFormat,
                },
            };
        });
    };

    const setIndividualCategory = (categoryId: string) => {
        updateStep2({ categoryIds: categoryId ? [categoryId] : [] });
    };

    const toggleSalonCategory = (categoryId: string) => {
        setWizard((prev) => {
            const exists = prev.step2.categoryIds.includes(categoryId);
            const categoryIds = exists
                ? prev.step2.categoryIds.filter((id) => id !== categoryId)
                : [...prev.step2.categoryIds, categoryId];

            return {
                ...prev,
                step2: {
                    ...prev.step2,
                    categoryIds,
                },
            };
        });
    };

    const updateDay = (dayId: DayId, patch: Partial<StepDay>) => {
        setWizard((prev) => ({
            ...prev,
            step5: {
                ...prev.step5,
                [dayId]: {
                    ...prev.step5[dayId],
                    ...patch,
                },
            },
        }));
    };

    const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] || null;
        if (!file) return;

        if (!isAllowedImageType(file)) {
            setError('Фото профиля: допустимы только JPG, PNG, WebP.');
            event.target.value = '';
            return;
        }

        setError(null);
        const previewUrl = URL.createObjectURL(file);
        updateStep1({
            avatarFile: file,
            avatarPreviewUrl: previewUrl,
        });
        event.target.value = '';
    };

    const removeAvatar = () => {
        updateStep1({
            avatarFile: null,
            avatarPreviewUrl: null,
        });
    };

    const handleWorkPhotoChange = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] || null;
        if (!file) return;

        if (!isAllowedImageType(file)) {
            setError('Фото работ: допустимы только JPG, PNG, WebP.');
            event.target.value = '';
            return;
        }

        setError(null);
        const previewUrl = URL.createObjectURL(file);
        setWizard((prev) => {
            const workPhotos = [...prev.step4.workPhotos] as WizardState['step4']['workPhotos'];
            workPhotos[index] = { file, previewUrl };
            return {
                ...prev,
                step4: {
                    ...prev.step4,
                    workPhotos,
                },
            };
        });
        event.target.value = '';
    };

    const removeWorkPhoto = (index: number) => {
        setWizard((prev) => {
            const workPhotos = [...prev.step4.workPhotos] as WizardState['step4']['workPhotos'];
            workPhotos[index] = { ...EMPTY_PHOTO_SLOT };
            return {
                ...prev,
                step4: {
                    ...prev.step4,
                    workPhotos,
                },
            };
        });
    };

    const appendBioTag = (tag: string) => {
        setWizard((prev) => {
            if (prev.step1.bio.includes(tag)) return prev;
            const bio = prev.step1.bio.trim().length > 0 ? `${prev.step1.bio.trim()}\n${tag}` : tag;
            return {
                ...prev,
                step1: {
                    ...prev.step1,
                    bio,
                },
            };
        });
    };

    const applyServiceSuggestion = (title: string) => {
        const defaults = serviceDefaults[title];
        const durationOptions = safeFlowType === 'INDIVIDUAL' ? INDIVIDUAL_DURATION_OPTIONS : SALON_DURATION_OPTIONS;
        const patch: Partial<WizardState['step4']> = { title };

        if (defaults?.price && defaults.price > 0) {
            patch.price = String(defaults.price);
        }
        if (defaults?.duration && defaults.duration > 0) {
            patch.duration = String(nearestDuration(defaults.duration, durationOptions));
        }

        updateStep4(patch);
        setShowServiceSuggestions(false);
    };

    const applyWeekdayPreset = () => {
        setWizard((prev) => ({
            ...prev,
            step5: {
                1: { enabled: true, start: '09:00', end: '18:00' },
                2: { enabled: true, start: '09:00', end: '18:00' },
                3: { enabled: true, start: '09:00', end: '18:00' },
                4: { enabled: true, start: '09:00', end: '18:00' },
                5: { enabled: true, start: '09:00', end: '18:00' },
                6: { enabled: false, start: '09:00', end: '18:00' },
                0: { enabled: false, start: '09:00', end: '18:00' },
            },
        }));
    };

    const applyFirstActiveDayTimeToAll = () => {
        const firstActive = DAYS.find((day) => wizard.step5[day.id].enabled);
        if (!firstActive) return;
        const source = wizard.step5[firstActive.id];

        setWizard((prev) => {
            const next = { ...prev.step5 };
            DAYS.forEach((day) => {
                if (next[day.id].enabled) {
                    next[day.id] = {
                        ...next[day.id],
                        start: source.start,
                        end: source.end,
                    };
                }
            });
            return {
                ...prev,
                step5: next,
            };
        });
    };

    const goBack = () => {
        setError(null);
        setCurrentStep((prev) => (prev === 1 ? prev : ((prev - 1) as StepNumber)));
    };

    const goNext = () => {
        if (!canGoNext) return;
        setError(null);
        setCurrentStep((prev) => (prev === 5 ? prev : ((prev + 1) as StepNumber)));
    };

    const completeOnboarding = async () => {
        if (!isStep5Valid || isSubmitting || !selectedPrimaryCategoryId) return;

        setIsSubmitting(true);
        setError(null);
        setSuccessMessage(null);

        try {
            const providerType: ProviderTypePayload = safeFlowType === 'SALON' ? 'SALON' : 'INDIVIDUAL';
            const profileName = wizard.step1.profileName.trim();
            const managerName = wizard.step1.managerName.trim();
            const city = wizard.step3.city.trim();
            const mainWorkFormat = wizard.step3.workFormat[0] || null;
            const address = safeFlowType === 'SALON'
                ? wizard.step3.address.trim()
                : mainWorkFormat === 'home' || mainWorkFormat === 'rent'
                    ? wizard.step3.address.trim()
                    : '';
            const bio = wizard.step1.bio.trim();
            let preparedBio = safeFlowType === 'SALON'
                ? `Контактное лицо: ${managerName}\n\n${bio}`
                : bio;

            if (safeFlowType === 'INDIVIDUAL' && wizard.step3.workFormat.length > 0) {
                const formatLabels = wizard.step3.workFormat.map((item) => WORK_FORMAT_LABELS[item]).join(', ');
                preparedBio = `${preparedBio}${preparedBio ? '\n\n' : ''}Формат работы: ${formatLabels}\n[workFormat:${wizard.step3.workFormat.join(',')}]`;
            }

            const onboardingStatusResult = await completeOnboardingStatus(session?.user?.id);
            if (!onboardingStatusResult.success) {
                setError(onboardingStatusResult.error || 'Не удалось завершить онбординг.');
                setIsSubmitting(false);
                return;
            }

            const profileFormData = new FormData();
            profileFormData.set('name', profileName);
            profileFormData.set('provider_type', providerType);
            profileFormData.set('city', city);
            profileFormData.set('address', address);
            profileFormData.set('bio', preparedBio);
            profileFormData.set('category_id', selectedPrimaryCategoryId);

            const profileResult = await createProviderProfile(profileFormData);
            if (!profileResult.success || !profileResult.profileId) {
                setError(profileResult.error || 'Не удалось создать профиль.');
                setIsSubmitting(false);
                return;
            }

            const profileId = profileResult.profileId;

            const profileUpdateData = new FormData();
            profileUpdateData.set('profile_id', String(profileId));
            profileUpdateData.set('name', profileName);
            profileUpdateData.set('provider_type', providerType);
            profileUpdateData.set('city', city);
            profileUpdateData.set('bio', preparedBio);
            if (safeFlowType === 'SALON') {
                profileUpdateData.set('address', address);
            }
            wizard.step2.languages.forEach((language) => {
                profileUpdateData.append('languages', language);
            });

            const profileUpdateResult = await updateProfile(profileUpdateData);
            if (!profileUpdateResult.success) {
                setError(profileUpdateResult.error || 'Не удалось обновить профиль.');
                setIsSubmitting(false);
                return;
            }

            if (safeFlowType === 'INDIVIDUAL' && wizard.step1.avatarFile) {
                const avatarFormData = new FormData();
                avatarFormData.set('file', wizard.step1.avatarFile);
                avatarFormData.set('profile_id', String(profileId));

                const avatarUploadResult = await uploadAvatar(avatarFormData);
                if (!avatarUploadResult.success) {
                    setError(avatarUploadResult.error || 'Не удалось загрузить фото профиля.');
                    setIsSubmitting(false);
                    return;
                }
            }

            const normalizedServiceTitle = wizard.step4.title.trim();
            const exactServiceTitle = BEAUTY_SERVICE_TITLES.find(
                (item) => item.toLowerCase() === normalizedServiceTitle.toLowerCase()
            ) || normalizedServiceTitle;

            if (!isBeautyServiceTitle(exactServiceTitle)) {
                setError('Выберите услугу из подсказок каталога.');
                setIsSubmitting(false);
                return;
            }

            const uploadedWorkPhotoUrls: string[] = [];
            if (safeFlowType === 'INDIVIDUAL') {
                for (const slot of wizard.step4.workPhotos) {
                    if (!slot.file) continue;

                    const photoFormData = new FormData();
                    photoFormData.set('photo', slot.file);
                    const photoResult = await uploadServicePhoto(photoFormData);

                    if (!photoResult.success || !photoResult.imageUrl) {
                        setError('Не удалось загрузить фото работ.');
                        setIsSubmitting(false);
                        return;
                    }

                    uploadedWorkPhotoUrls.push(photoResult.imageUrl);
                }
            }

            const serviceFormData = new FormData();
            serviceFormData.set('profile_id', String(profileId));
            serviceFormData.set('title', exactServiceTitle);
            serviceFormData.set('price', String(parsedPrice));
            serviceFormData.set('duration', wizard.step4.duration);
            if (wizard.step4.description.trim()) {
                serviceFormData.set('description', wizard.step4.description.trim());
            }
            if (uploadedWorkPhotoUrls.length > 0) {
                serviceFormData.set('images', JSON.stringify(uploadedWorkPhotoUrls));
            }

            const serviceResult = await addService(serviceFormData);
            if (!serviceResult.success) {
                setError(serviceResult.error || 'Не удалось добавить услугу.');
                setIsSubmitting(false);
                return;
            }

            const startMinutes = activeDays
                .map((day) => parseTimeToMinutes(wizard.step5[day.id].start))
                .filter((value): value is number => value !== null);

            const endMinutes = activeDays
                .map((day) => parseTimeToMinutes(wizard.step5[day.id].end))
                .filter((value): value is number => value !== null);

            const scheduleFormData = new FormData();
            scheduleFormData.set('profile_id', String(profileId));
            scheduleFormData.set('start_time', minutesToTime(Math.min(...startMinutes)));
            scheduleFormData.set('end_time', minutesToTime(Math.max(...endMinutes)));
            activeDays.forEach((day) => {
                scheduleFormData.append('working_days', String(day.id));
            });

            const scheduleResult = await updateSchedule(scheduleFormData);
            if (!scheduleResult.success) {
                setError(scheduleResult.error || 'Не удалось сохранить расписание.');
                setIsSubmitting(false);
                return;
            }

            await update();
            await new Promise((resolve) => setTimeout(resolve, 800));

            setSuccessMessage('Профиль создан! Перенаправляем...');
            router.push(`/dashboard/${profileId}`);
        } catch (submitError) {
            console.error('Master onboarding submit error:', submitError);
            setError('Не удалось завершить регистрацию. Попробуйте снова.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const mainWorkFormat = wizard.step3.workFormat[0] || null;
    const showIndividualLocationFields = safeFlowType === 'INDIVIDUAL' && wizard.step3.workFormat.length > 0;
    const durationOptions = safeFlowType === 'INDIVIDUAL' ? INDIVIDUAL_DURATION_OPTIONS : SALON_DURATION_OPTIONS;

    return (
        <main className="min-h-screen bg-gray-50 px-4 py-10">
            <div className="mx-auto w-full max-w-[600px]">
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xl sm:p-8">
                    <div className="mb-8">
                        <p className="text-sm font-medium text-gray-500">Шаг {currentStep} из 5</p>
                        <div className="mt-4 flex items-center gap-2">
                            {[1, 2, 3, 4, 5].map((step, index) => {
                                const stepNumber = step as StepNumber;
                                const isCompleted = stepNumber < currentStep;
                                const isCurrent = stepNumber === currentStep;

                                return (
                                    <div key={stepNumber} className="flex flex-1 items-center">
                                        <div
                                            className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold ${
                                                isCompleted
                                                    ? 'border-emerald-500 bg-emerald-500 text-white'
                                                    : isCurrent
                                                        ? 'border-slate-900 bg-slate-900 text-white'
                                                        : 'border-gray-300 bg-white text-gray-500'
                                            }`}
                                        >
                                            {isCompleted ? <Check className="h-4 w-4" /> : stepNumber}
                                        </div>
                                        {index < 4 ? (
                                            <div
                                                className={`h-1 flex-1 rounded-full ${
                                                    stepNumber < currentStep ? 'bg-emerald-500' : 'bg-gray-200'
                                                }`}
                                            />
                                        ) : null}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="mb-6">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                            {stepMeta.label}
                        </p>
                        <h1 className="mt-2 text-2xl font-bold text-gray-900">{stepMeta.title}</h1>
                        {stepMeta.subtitle ? (
                            <p className="mt-2 text-sm text-gray-500">{stepMeta.subtitle}</p>
                        ) : null}
                    </div>

                    {error ? (
                        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {error}
                        </div>
                    ) : null}

                    {successMessage ? (
                        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                            {successMessage}
                        </div>
                    ) : null}

                    {currentStep === 1 ? (
                        <section className="space-y-5">
                            {safeFlowType === 'INDIVIDUAL' ? (
                                <>
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-gray-700">Имя</label>
                                        <input
                                            type="text"
                                            value={wizard.step1.profileName}
                                            onChange={(event) => updateStep1({ profileName: event.target.value })}
                                            placeholder="Например: Анна Краузе"
                                            className="h-11 w-full rounded-xl border border-gray-300 px-3 text-sm text-gray-900 outline-none transition focus:border-gray-900"
                                        />
                                    </div>

                                    <div className="flex flex-col items-center">
                                        <label className="group relative flex h-28 w-28 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-dashed border-gray-300 bg-gray-100">
                                            {wizard.step1.avatarPreviewUrl ? (
                                                <img
                                                    src={wizard.step1.avatarPreviewUrl}
                                                    alt="avatar-preview"
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <div className="flex flex-col items-center gap-1 text-gray-500">
                                                    <Camera className="h-5 w-5" />
                                                    <span className="text-[11px] font-medium">Добавить фото</span>
                                                </div>
                                            )}
                                            <input
                                                type="file"
                                                accept="image/jpeg,image/png,image/webp"
                                                className="hidden"
                                                onChange={handleAvatarChange}
                                            />
                                        </label>
                                        {wizard.step1.avatarPreviewUrl ? (
                                            <button
                                                type="button"
                                                onClick={removeAvatar}
                                                className="mt-2 text-xs font-medium text-gray-500 hover:text-gray-700"
                                            >
                                                Удалить фото
                                            </button>
                                        ) : null}
                                        <p className="mt-2 text-center text-xs text-gray-500">
                                            Профили с фото получают больше доверия
                                        </p>
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-gray-700">О себе</label>
                                        <textarea
                                            rows={5}
                                            value={wizard.step1.bio}
                                            onChange={(event) => updateStep1({ bio: event.target.value })}
                                            placeholder="Расскажите клиентам о себе..."
                                            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-gray-900"
                                        />
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {BIO_QUICK_TAGS.map((tag) => (
                                                <button
                                                    key={tag}
                                                    type="button"
                                                    onClick={() => appendBioTag(tag)}
                                                    className="rounded-full border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
                                                >
                                                    {tag}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-gray-700">Название салона</label>
                                        <input
                                            type="text"
                                            value={wizard.step1.profileName}
                                            onChange={(event) => updateStep1({ profileName: event.target.value })}
                                            placeholder="Например: Beauty Studio Anna"
                                            className="h-11 w-full rounded-xl border border-gray-300 px-3 text-sm text-gray-900 outline-none transition focus:border-gray-900"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-gray-700">О салоне</label>
                                        <textarea
                                            rows={5}
                                            value={wizard.step1.bio}
                                            onChange={(event) => updateStep1({ bio: event.target.value })}
                                            placeholder="Опишите ваш салон, атмосферу и преимущества..."
                                            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-gray-900"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-gray-700">
                                            Имя управляющего / контактное лицо
                                        </label>
                                        <input
                                            type="text"
                                            value={wizard.step1.managerName}
                                            onChange={(event) => updateStep1({ managerName: event.target.value })}
                                            placeholder="Как к вам обращаться?"
                                            className="h-11 w-full rounded-xl border border-gray-300 px-3 text-sm text-gray-900 outline-none transition focus:border-gray-900"
                                        />
                                    </div>
                                </>
                            )}
                        </section>
                    ) : null}

                    {currentStep === 2 ? (
                        <section className="space-y-5">
                            {safeFlowType === 'INDIVIDUAL' ? (
                                <>
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-gray-700">Категория</label>
                                        <select
                                            value={selectedPrimaryCategoryId}
                                            onChange={(event) => setIndividualCategory(event.target.value)}
                                            className="h-11 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-gray-900"
                                        >
                                            <option value="">Выберите категорию</option>
                                            {categories.map((category) => (
                                                <option key={category.id} value={category.id}>
                                                    {category.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <p className="mb-2 text-sm font-medium text-gray-700">Опыт работы</p>
                                        <div className="flex flex-wrap gap-2">
                                            {EXPERIENCE_OPTIONS.map((option) => (
                                                <label
                                                    key={option.value}
                                                    className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-700"
                                                >
                                                    <input
                                                        type="radio"
                                                        name="experience"
                                                        checked={wizard.step2.experience === option.value}
                                                        onChange={() => updateStep2({ experience: option.value })}
                                                        className="h-4 w-4 border-gray-300 text-slate-900 focus:ring-slate-300"
                                                    />
                                                    {option.label}
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <p className="mb-2 text-sm font-medium text-gray-700">С кем работаете</p>
                                        <div className="flex flex-wrap gap-2">
                                            {AUDIENCE_OPTIONS.map((option) => (
                                                <label
                                                    key={option.value}
                                                    className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-700"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={wizard.step2.audiences.includes(option.value)}
                                                        onChange={() => toggleAudience(option.value)}
                                                        className="h-4 w-4 rounded border-gray-300 text-slate-900 focus:ring-slate-300"
                                                    />
                                                    <span>{option.icon}</span>
                                                    <span>{option.label}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div>
                                    <p className="mb-2 block text-sm font-medium text-gray-700">Категории</p>
                                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                        {categories.map((category) => {
                                            const checked = wizard.step2.categoryIds.includes(String(category.id));
                                            return (
                                                <label
                                                    key={category.id}
                                                    className="flex cursor-pointer items-center gap-2 rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-700"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={checked}
                                                        onChange={() => toggleSalonCategory(String(category.id))}
                                                        className="h-4 w-4 rounded border-gray-300 text-slate-900 focus:ring-slate-300"
                                                    />
                                                    {category.name}
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <div>
                                <p className="mb-2 text-sm font-medium text-gray-700">Языки</p>
                                <div className="space-y-2">
                                    {PROVIDER_LANGUAGE_OPTIONS.map((option) => (
                                        <label
                                            key={option.value}
                                            className="flex cursor-pointer items-center gap-2 rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-700"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={wizard.step2.languages.includes(option.value)}
                                                onChange={() => toggleLanguage(option.value)}
                                                className="h-4 w-4 rounded border-gray-300 text-slate-900 focus:ring-slate-300"
                                            />
                                            <span>{option.flag}</span>
                                            <span>{option.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </section>
                    ) : null}

                    {currentStep === 3 ? (
                        <section className="space-y-5">
                            {safeFlowType === 'INDIVIDUAL' ? (
                                <>
                                    <div>
                                        <p className="mb-2 text-sm font-medium text-gray-700">Формат работы</p>
                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                            {WORK_FORMAT_OPTIONS.map((option) => {
                                                const selected = wizard.step3.workFormat.includes(option.value);
                                                return (
                                                    <button
                                                        key={option.value}
                                                        type="button"
                                                        onClick={() => toggleWorkFormat(option.value)}
                                                        className={`rounded-xl border px-4 py-4 text-left transition ${
                                                            selected
                                                                ? 'border-slate-900 bg-slate-900 text-white'
                                                                : 'border-gray-300 bg-white text-gray-800 hover:border-gray-400'
                                                        } ${option.value === 'rent' ? 'sm:col-span-2' : ''}`}
                                                    >
                                                        <div className="text-base">
                                                            {option.icon} {option.title}
                                                        </div>
                                                        {option.subtitle ? (
                                                            <div className={`mt-1 text-sm ${selected ? 'text-slate-100' : 'text-gray-500'}`}>
                                                                {option.subtitle}
                                                            </div>
                                                        ) : null}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {showIndividualLocationFields ? (
                                        <>
                                            <div className="relative">
                                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                                    {mainWorkFormat === 'visit' ? 'Город базирования' : 'Город'}
                                                </label>
                                                <input
                                                    type="text"
                                                    value={wizard.step3.city}
                                                    onChange={(event) => updateStep3({ city: event.target.value })}
                                                    onFocus={() => setShowCitySuggestions(true)}
                                                    onBlur={() => {
                                                        setTimeout(() => setShowCitySuggestions(false), 120);
                                                    }}
                                                    className="h-11 w-full rounded-xl border border-gray-300 px-3 text-sm text-gray-900 outline-none transition focus:border-gray-900"
                                                />

                                                {showCitySuggestions && citySuggestions.length > 0 ? (
                                                    <div className="absolute z-10 mt-1 w-full rounded-xl border border-gray-200 bg-white shadow-lg">
                                                        <ul className="max-h-[200px] overflow-y-auto py-1">
                                                            {citySuggestions.map((city) => (
                                                                <li key={city}>
                                                                    <button
                                                                        type="button"
                                                                        onMouseDown={(event) => event.preventDefault()}
                                                                        onClick={() => {
                                                                            updateStep3({ city });
                                                                            setShowCitySuggestions(false);
                                                                        }}
                                                                        className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                                                                    >
                                                                        {city}
                                                                    </button>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                ) : null}
                                            </div>

                                            {(mainWorkFormat === 'home' || mainWorkFormat === 'rent') ? (
                                                <div>
                                                    <label className="mb-2 block text-sm font-medium text-gray-700">
                                                        Улица и номер дома
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={wizard.step3.address}
                                                        onChange={(event) => updateStep3({ address: event.target.value })}
                                                        className="h-11 w-full rounded-xl border border-gray-300 px-3 text-sm text-gray-900 outline-none transition focus:border-gray-900"
                                                    />
                                                </div>
                                            ) : null}

                                            {mainWorkFormat === 'home' ? (
                                                <>
                                                    <div>
                                                        <label className="mb-2 block text-sm font-medium text-gray-700">
                                                            Почтовый индекс
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={wizard.step3.zipCode}
                                                            onChange={(event) => updateStep3({ zipCode: event.target.value })}
                                                            className="h-11 w-full rounded-xl border border-gray-300 px-3 text-sm text-gray-900 outline-none transition focus:border-gray-900"
                                                        />
                                                    </div>

                                                    <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-gray-300 px-3 py-3 text-sm text-gray-700">
                                                        <input
                                                            type="checkbox"
                                                            checked={wizard.step3.hideExactAddress}
                                                            onChange={(event) =>
                                                                updateStep3({ hideExactAddress: event.target.checked })
                                                            }
                                                            className="h-4 w-4 rounded border-gray-300 text-slate-900 focus:ring-slate-300"
                                                        />
                                                        Не показывать точный адрес - только район
                                                    </label>
                                                    <p className="text-xs text-gray-500">Ваш точный адрес виден только вам</p>
                                                </>
                                            ) : null}

                                            {mainWorkFormat === 'visit' ? (
                                                <div>
                                                    <label className="mb-2 block text-sm font-medium text-gray-700">
                                                        Радиус выезда в км
                                                    </label>
                                                    <select
                                                        value={wizard.step3.travelRadiusKm}
                                                        onChange={(event) => updateStep3({ travelRadiusKm: event.target.value })}
                                                        className="h-11 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-gray-900"
                                                    >
                                                        {TRAVEL_RADIUS_OPTIONS.map((value) => (
                                                            <option key={value} value={value}>
                                                                {value} км
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            ) : null}

                                            {mainWorkFormat === 'rent' ? (
                                                <div>
                                                    <label className="mb-2 block text-sm font-medium text-gray-700">
                                                        Название салона (необязательно)
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={wizard.step3.salonName}
                                                        onChange={(event) => updateStep3({ salonName: event.target.value })}
                                                        className="h-11 w-full rounded-xl border border-gray-300 px-3 text-sm text-gray-900 outline-none transition focus:border-gray-900"
                                                    />
                                                </div>
                                            ) : null}
                                        </>
                                    ) : (
                                        <p className="rounded-xl border border-dashed border-gray-300 px-3 py-4 text-sm text-gray-500">
                                            Выберите один или несколько форматов, чтобы заполнить адресные данные.
                                        </p>
                                    )}
                                </>
                            ) : (
                                <>
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-gray-700">Город</label>
                                        <input
                                            type="text"
                                            value={wizard.step3.city}
                                            onChange={(event) => updateStep3({ city: event.target.value })}
                                            className="h-11 w-full rounded-xl border border-gray-300 px-3 text-sm text-gray-900 outline-none transition focus:border-gray-900"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-gray-700">
                                            Улица и номер дома
                                        </label>
                                        <input
                                            type="text"
                                            value={wizard.step3.address}
                                            onChange={(event) => updateStep3({ address: event.target.value })}
                                            className="h-11 w-full rounded-xl border border-gray-300 px-3 text-sm text-gray-900 outline-none transition focus:border-gray-900"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-gray-700">Почтовый индекс</label>
                                        <input
                                            type="text"
                                            value={wizard.step3.zipCode}
                                            onChange={(event) => updateStep3({ zipCode: event.target.value })}
                                            className="h-11 w-full rounded-xl border border-gray-300 px-3 text-sm text-gray-900 outline-none transition focus:border-gray-900"
                                        />
                                    </div>
                                </>
                            )}
                        </section>
                    ) : null}

                    {currentStep === 4 ? (
                        <section className="space-y-5">
                            <div className="relative">
                                <label className="mb-2 block text-sm font-medium text-gray-700">Название услуги</label>
                                <input
                                    type="text"
                                    value={wizard.step4.title}
                                    onChange={(event) => updateStep4({ title: event.target.value })}
                                    onFocus={() => setShowServiceSuggestions(true)}
                                    onBlur={() => {
                                        setTimeout(() => setShowServiceSuggestions(false), 120);
                                    }}
                                    placeholder="Например: Мужская стрижка"
                                    className="h-11 w-full rounded-xl border border-gray-300 px-3 text-sm text-gray-900 outline-none transition focus:border-gray-900"
                                />

                                {showServiceSuggestions && filteredServiceSuggestions.length > 0 ? (
                                    <div className="absolute z-10 mt-1 w-full rounded-xl border border-gray-200 bg-white shadow-lg">
                                        <ul className="max-h-[200px] overflow-y-auto py-1">
                                            {filteredServiceSuggestions.map((serviceTitle) => (
                                                <li key={serviceTitle}>
                                                    <button
                                                        type="button"
                                                        onMouseDown={(event) => event.preventDefault()}
                                                        onClick={() => applyServiceSuggestion(serviceTitle)}
                                                        className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                                                    >
                                                        {serviceTitle}
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ) : null}

                                {safeFlowType === 'INDIVIDUAL' ? (
                                    <p className="mt-2 text-xs text-gray-500">
                                        Выбирайте услугу из подсказок, чтобы автоматически подставить средние цену и время.
                                    </p>
                                ) : null}
                                {safeFlowType === 'SALON' && !validServiceTitle && wizard.step4.title.trim().length > 0 ? (
                                    <p className="mt-2 text-xs text-amber-700">Выберите услугу из подсказок.</p>
                                ) : null}
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">Цена €</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={wizard.step4.price}
                                    onChange={(event) => updateStep4({ price: event.target.value })}
                                    className="h-11 w-full rounded-xl border border-gray-300 px-3 text-sm text-gray-900 outline-none transition focus:border-gray-900"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">Длительность</label>
                                <select
                                    value={wizard.step4.duration}
                                    onChange={(event) => updateStep4({ duration: event.target.value })}
                                    className="h-11 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-gray-900"
                                >
                                    {durationOptions.map((duration) => (
                                        <option key={duration} value={duration}>
                                            {duration} мин
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">Описание (необязательно)</label>
                                <textarea
                                    rows={4}
                                    value={wizard.step4.description}
                                    onChange={(event) => updateStep4({ description: event.target.value })}
                                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-gray-900"
                                />
                            </div>

                            {safeFlowType === 'INDIVIDUAL' ? (
                                <div className="rounded-xl border border-gray-300 p-4">
                                    <h3 className="text-sm font-semibold text-gray-900">Фото работ по этой услуге</h3>
                                    <p className="mt-1 text-xs text-gray-500">Клиенты смотрят фото перед записью</p>

                                    <div className="mt-3 grid grid-cols-3 gap-3">
                                        {wizard.step4.workPhotos.map((slot, index) => (
                                            <div
                                                key={`work-photo-slot-${index}`}
                                                className="relative aspect-square overflow-hidden rounded-xl border border-dashed border-gray-300 bg-gray-50"
                                            >
                                                <label className="flex h-full w-full cursor-pointer items-center justify-center">
                                                    {slot.previewUrl ? (
                                                        <img
                                                            src={slot.previewUrl}
                                                            alt={`work-photo-${index + 1}`}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="flex flex-col items-center gap-1 text-gray-500">
                                                            <Plus className="h-4 w-4" />
                                                            <span className="text-[11px]">добавить</span>
                                                        </div>
                                                    )}
                                                    <input
                                                        type="file"
                                                        accept="image/jpeg,image/png,image/webp"
                                                        className="hidden"
                                                        onChange={(event) => handleWorkPhotoChange(index, event)}
                                                    />
                                                </label>

                                                {slot.previewUrl ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeWorkPhoto(index)}
                                                        className="absolute right-1 top-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white"
                                                        aria-label="Удалить фото"
                                                    >
                                                        <X className="h-3.5 w-3.5" />
                                                    </button>
                                                ) : null}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : null}
                        </section>
                    ) : null}

                    {currentStep === 5 ? (
                        <section className="space-y-3">
                            {safeFlowType === 'INDIVIDUAL' ? (
                                <button
                                    type="button"
                                    onClick={applyWeekdayPreset}
                                    className="w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                                >
                                    Пн-Пт, 09:00-18:00 (стандартный)
                                </button>
                            ) : null}

                            {DAYS.map((day) => {
                                const dayState = wizard.step5[day.id];
                                return (
                                    <div key={day.id} className="rounded-xl border border-gray-300 px-3 py-3">
                                        <label className="flex items-center gap-2 text-sm font-medium text-gray-800">
                                            <input
                                                type="checkbox"
                                                checked={dayState.enabled}
                                                onChange={(event) => updateDay(day.id, { enabled: event.target.checked })}
                                                className="h-4 w-4 rounded border-gray-300 text-slate-900 focus:ring-slate-300"
                                            />
                                            <span className="inline-block w-10">{day.label}</span>
                                            <span>Работаю в этот день</span>
                                        </label>

                                        {dayState.enabled ? (
                                            <div className="mt-3 grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="mb-1 block text-xs uppercase text-gray-500">с</label>
                                                    <input
                                                        type="time"
                                                        value={dayState.start}
                                                        onChange={(event) => updateDay(day.id, { start: event.target.value })}
                                                        className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm text-gray-900 outline-none transition focus:border-gray-900"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="mb-1 block text-xs uppercase text-gray-500">до</label>
                                                    <input
                                                        type="time"
                                                        value={dayState.end}
                                                        onChange={(event) => updateDay(day.id, { end: event.target.value })}
                                                        className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm text-gray-900 outline-none transition focus:border-gray-900"
                                                    />
                                                </div>
                                            </div>
                                        ) : null}
                                    </div>
                                );
                            })}

                            {safeFlowType === 'INDIVIDUAL' ? (
                                <button
                                    type="button"
                                    onClick={applyFirstActiveDayTimeToAll}
                                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                                >
                                    Применить одно время ко всем рабочим дням
                                </button>
                            ) : null}

                            <p className="text-xs text-gray-500">
                                При сохранении используется единый рабочий диапазон времени для выбранных дней.
                            </p>
                        </section>
                    ) : null}

                    <div className="mt-8 flex items-center justify-between gap-3">
                        {currentStep > 1 ? (
                            <button
                                type="button"
                                onClick={goBack}
                                disabled={isSubmitting}
                                className="h-11 rounded-xl border border-gray-300 px-5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
                            >
                                ← Назад
                            </button>
                        ) : (
                            <div />
                        )}

                        {currentStep < 5 ? (
                            <button
                                type="button"
                                onClick={goNext}
                                disabled={!canGoNext || isSubmitting}
                                className="h-11 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                Далее →
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={completeOnboarding}
                                disabled={!isStep5Valid || isSubmitting}
                                className="inline-flex h-11 items-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                                Завершить регистрацию ✓
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
