'use client';

import { useMemo, useState } from 'react';
import { Camera, Check, Loader2, Upload, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { publishProviderProfile, saveProviderDraft } from '@/app/actions/providerOnboarding';
import { uploadServicePhoto } from '@/app/actions/upload';
import { uploadAvatar } from '@/app/actions/uploadAvatar';
import type { OnboardingCategoryOption } from '@/app/actions/onboardingCategories';
import {
    BEAUTY_SERVICES,
    BEAUTY_SERVICE_TITLES,
} from '@/lib/constants/services-taxonomy';
import {
    normalizeProviderLanguage,
    PROVIDER_LANGUAGE_OPTIONS,
    type ProviderLanguage,
} from '@/lib/provider-languages';
import { CityCombobox } from '@/components/provider/CityCombobox';
import { StreetAddressAutocomplete } from '@/components/provider/StreetAddressAutocomplete';
import { findGermanCitySelection } from '@/lib/german-city-options';
import { useTranslations } from 'next-intl';

type FlowType = 'INDIVIDUAL' | 'SALON';
type StepNumber = 1 | 2 | 3 | 4 | 5;
type DayId = 1 | 2 | 3 | 4 | 5 | 6 | 0;
type ProviderTypePayload = 'INDIVIDUAL' | 'SALON';
type AudienceValue = 'women' | 'men' | 'kids';
type ServiceCategoryKey = 'HAIR' | 'NAILS' | 'BROWS_LASHES' | 'COSMETOLOGY' | 'MASSAGE' | 'OTHER';

type StepDay = {
    enabled: boolean;
    start: string;
    end: string;
};

type WorkLocationInput = {
    placeName: string;
    street: string;
    houseNumber: string;
    address: string;
    zipCode: string;
    city: string;
    cityLatitude: number | null;
    cityLongitude: number | null;
    latitude: number | null;
    longitude: number | null;
    hideExactAddress: boolean;
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
        audiences: AudienceValue[];
    };
    step3: {
        providesInStudio: boolean;
        providesOutcall: boolean;
        outcallRadiusKm: string;
        workLocations: WorkLocationInput[];
        city: string;
        cityLatitude: number | null;
        cityLongitude: number | null;
        street: string;
        houseNumber: string;
        address: string;
        addressLatitude: number | null;
        addressLongitude: number | null;
        zipCode: string;
    };
    step4: {
        serviceCategory: ServiceCategoryKey | '';
        serviceSubservice: string;
        otherCategoryDetail: string;
        title: string;
        price: string;
        isStartingPrice: boolean;
        duration: string;
        description: string;
        imageFile: File | null;
        imagePreviewUrl: string | null;
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
    onboardingStep?: number;
    workLocations?: WorkLocationInput[];
    audiences?: AudienceValue[];
    managerName?: string;
    zipCode?: string;
    providesInStudio?: boolean;
    providesOutcall?: boolean;
    outcallRadiusKm?: number | null;
    latitude?: number | null;
    longitude?: number | null;
};

type ServiceDefaults = Record<string, { price: number; duration: number }>;

type MasterOnboardingWizardProps = {
    userName: string;
    flowType?: FlowType;
    categories: OnboardingCategoryOption[];
    serviceDefaults: ServiceDefaults;
    initialProfile: InitialProfile | null;
};

const DURATION_OPTIONS = Array.from({ length: 20 }, (_, index) => (index + 1) * 15);
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const DEFAULT_STEP2_LANGUAGES: ProviderLanguage[] = [normalizeProviderLanguage('ru')].filter(Boolean) as ProviderLanguage[];
const OUTCALL_RADIUS_MIN = 1;
const OUTCALL_RADIUS_MAX = 100;

const CATEGORY_MATCH_KEYWORDS: Record<ServiceCategoryKey, string[]> = {
    HAIR: ['hair', 'volos', 'волос', 'стриж', 'парикмах'],
    NAILS: ['nail', 'ногт', 'маник', 'педик'],
    BROWS_LASHES: ['brow', 'lash', 'ресниц', 'бров'],
    COSMETOLOGY: ['kosmet', 'cosmet', 'уход', 'skin', 'лицо'],
    MASSAGE: ['massage', 'массаж', 'body', 'тело'],
    OTHER: ['beauty', 'красот', 'бьюти'],
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

function createEmptyWorkLocation(): WorkLocationInput {
    return {
        placeName: '',
        street: '',
        houseNumber: '',
        address: '',
        zipCode: '',
        city: '',
        cityLatitude: null,
        cityLongitude: null,
        latitude: null,
        longitude: null,
        hideExactAddress: true,
    };
}

function splitStreetAndHouse(address: string | null | undefined) {
    const value = (address || '').trim();
    if (!value) {
        return { street: '', houseNumber: '' };
    }

    const match = value.match(/^(.*?)(?:\s+(\d+[a-zA-Z]?(?:[/-]\d+[a-zA-Z]?)?))$/);
    if (!match) {
        return { street: value, houseNumber: '' };
    }

    return {
        street: match[1]?.trim() || value,
        houseNumber: match[2]?.trim() || '',
    };
}

function combineStreetAndHouse(street: string, houseNumber: string) {
    return [street.trim(), houseNumber.trim()].filter(Boolean).join(' ').trim();
}

function normalizePriceInput(value: string) {
    const normalized = value.replace(',', '.').replace(/[^\d.]/g, '');
    const [integerPart, ...decimalParts] = normalized.split('.');

    if (decimalParts.length === 0) {
        return integerPart;
    }

    return `${integerPart}.${decimalParts.join('')}`;
}

function resolveInitialCitySelection(
    city: string | null | undefined,
    latitude?: number | null,
    longitude?: number | null,
) {
    const normalizedCity = city?.trim().toLowerCase() === 'draft' ? '' : city || '';
    const matched = city ? findGermanCitySelection(city) : null;
    return {
        city: matched?.germanName || normalizedCity,
        cityLatitude: matched?.lat ?? latitude ?? null,
        cityLongitude: matched?.lng ?? longitude ?? null,
    };
}

function hasSelectedCity(city: string) {
    const normalized = city.trim().toLowerCase();
    if (!normalized || normalized === 'draft') {
        return false;
    }

    return Boolean(findGermanCitySelection(city));
}

function clampOutcallRadius(value?: number | null) {
    if (!Number.isFinite(value)) return 15;
    return Math.min(OUTCALL_RADIUS_MAX, Math.max(OUTCALL_RADIUS_MIN, Math.round(Number(value))));
}

function resolveCategoryIdFromServiceCategory(
    serviceCategory: ServiceCategoryKey | '',
    categories: OnboardingCategoryOption[],
    fallbackCategoryId?: number
) {
    const beautyCategory = categories.find((category) => category.slug === 'beauty');
    const fallback = beautyCategory?.id ?? categories[0]?.id ?? fallbackCategoryId ?? 1;
    if (!serviceCategory) return fallback;

    const keywords = CATEGORY_MATCH_KEYWORDS[serviceCategory];
    const matched = categories.find((category) => {
        const haystack = `${category.slug} ${category.name}`.toLowerCase();
        return keywords.some((keyword) => haystack.includes(keyword));
    });
    return matched?.id ?? fallback;
}

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

function getInitialLanguages(initialProfile: InitialProfile | null): ProviderLanguage[] {
    const normalized = initialProfile ? normalizeLanguages(initialProfile.languages) : [];
    return normalized.length > 0 ? normalized : DEFAULT_STEP2_LANGUAGES;
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

function isAllowedImageType(file: File) {
    return ALLOWED_IMAGE_TYPES.includes(file.type);
}

function clampStep(value?: number): StepNumber {
    if (!value || value < 1) return 1;
    if (value > 5) return 5;
    return value as StepNumber;
}

export function MasterOnboardingWizard({
    userName,
    flowType = 'INDIVIDUAL',
    categories,
    serviceDefaults: _serviceDefaults,
    initialProfile,
}: MasterOnboardingWizardProps) {
    const t = useTranslations('dashboard.provider.onboardingWizard');
    const safeFlowType: FlowType = flowType === 'SALON' ? 'SALON' : 'INDIVIDUAL';
    const initialBaseCity = resolveInitialCitySelection(
        initialProfile?.city,
        initialProfile?.latitude,
        initialProfile?.longitude,
    );
    const initialAddressParts = splitStreetAndHouse(initialProfile?.address);
    const router = useRouter();
    const { data: session, update } = useSession();
    const [currentStep, setCurrentStep] = useState<StepNumber>(clampStep(initialProfile?.onboardingStep));
    const [draftProfileId, setDraftProfileId] = useState<number | null>(initialProfile?.id ?? null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [stepError, setStepError] = useState<string | null>(null);
    const [serviceImageError, setServiceImageError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [showServiceSuggestions, setShowServiceSuggestions] = useState(false);

    const [wizard, setWizard] = useState<WizardState>(() => ({
        step1: {
            profileName: initialProfile?.name || userName || '',
            bio: initialProfile?.bio || '',
            managerName: initialProfile?.managerName || userName || '',
            avatarFile: null,
            avatarPreviewUrl: initialProfile?.imageUrl || null,
        },
        step2: {
            categoryIds: initialProfile?.categoryId ? [String(initialProfile.categoryId)] : [],
            languages: getInitialLanguages(initialProfile),
            audiences: initialProfile?.audiences || [],
        },
        step3: {
            providesInStudio: initialProfile?.providesInStudio ?? false,
            providesOutcall: initialProfile?.providesOutcall ?? false,
            outcallRadiusKm: String(clampOutcallRadius(initialProfile?.outcallRadiusKm)),
            workLocations: initialProfile?.workLocations?.length
                ? initialProfile.workLocations.map((location) => {
                    const parts = splitStreetAndHouse(location.address);
                    return {
                        ...location,
                        street: location.street || parts.street,
                        houseNumber: location.houseNumber || parts.houseNumber,
                    };
                })
                : initialProfile
                    ? [{
                        placeName: initialProfile.providerType === 'SALON' ? initialProfile.name : '',
                        street: initialAddressParts.street,
                        houseNumber: initialAddressParts.houseNumber,
                        address: initialProfile.address || '',
                        zipCode: initialProfile.zipCode || '',
                        city: initialBaseCity.city,
                        cityLatitude: initialBaseCity.cityLatitude,
                        cityLongitude: initialBaseCity.cityLongitude,
                        latitude: initialProfile.latitude ?? null,
                        longitude: initialProfile.longitude ?? null,
                        hideExactAddress: true,
                    }]
                : [createEmptyWorkLocation()],
            city: initialBaseCity.city,
            cityLatitude: initialBaseCity.cityLatitude,
            cityLongitude: initialBaseCity.cityLongitude,
            street: initialAddressParts.street,
            houseNumber: initialAddressParts.houseNumber,
            address: initialProfile?.address || '',
            addressLatitude: initialProfile?.latitude ?? null,
            addressLongitude: initialProfile?.longitude ?? null,
            zipCode: initialProfile?.zipCode || '',
        },
        step4: {
            serviceCategory: '',
            serviceSubservice: '',
            otherCategoryDetail: '',
            title: '',
            price: '',
            isStartingPrice: false,
            duration: '60',
            description: '',
            imageFile: null,
            imagePreviewUrl: null,
        },
        step5: createDefaultDayState(safeFlowType),
    }));

    const days = useMemo<Array<{ id: DayId; label: string }>>(() => ([
        { id: 1, label: t('days.mon') },
        { id: 2, label: t('days.tue') },
        { id: 3, label: t('days.wed') },
        { id: 4, label: t('days.thu') },
        { id: 5, label: t('days.fri') },
        { id: 6, label: t('days.sat') },
        { id: 0, label: t('days.sun') },
    ]), [t]);
    const bioQuickTags = useMemo(() => [
        t('bioTags.experience'),
        t('bioTags.homeStudio'),
        t('bioTags.outcall'),
        t('bioTags.children'),
        t('bioTags.naturalMaterials'),
    ], [t]);
    const placeNamePresets = useMemo(() => [
        t('placePresets.rent'),
        t('placePresets.ownSalon'),
        t('placePresets.home'),
    ], [t]);
    const audienceOptions = useMemo<Array<{ value: AudienceValue; icon: string; label: string }>>(() => [
        { value: 'women', icon: '👩', label: t('audiences.women') },
        { value: 'men', icon: '👨', label: t('audiences.men') },
        { value: 'kids', icon: '👧', label: t('audiences.kids') },
    ], [t]);
    const serviceCategoryOptions = useMemo<Array<{ value: ServiceCategoryKey; label: string; icon: string }>>(() => [
        { value: 'HAIR', label: t('serviceCategories.hair'), icon: '✂️' },
        { value: 'NAILS', label: t('serviceCategories.nails'), icon: '💅' },
        { value: 'BROWS_LASHES', label: t('serviceCategories.browsLashes'), icon: '👁️' },
        { value: 'COSMETOLOGY', label: t('serviceCategories.cosmetology'), icon: '🧴' },
        { value: 'MASSAGE', label: t('serviceCategories.massage'), icon: '💆' },
        { value: 'OTHER', label: t('serviceCategories.other'), icon: '✨' },
    ], [t]);
    const otherSubserviceLabel = t('subservices.other');
    const serviceSubservices = useMemo<Record<ServiceCategoryKey, string[]>>(() => ({
        HAIR: [t('subservices.hair.men'), t('subservices.hair.women'), t('subservices.hair.kids'), t('subservices.hair.color'), otherSubserviceLabel],
        NAILS: [t('subservices.nails.classic'), t('subservices.nails.hardware'), t('subservices.nails.gel'), t('subservices.nails.extensions'), t('subservices.nails.pedicure'), otherSubserviceLabel],
        BROWS_LASHES: [t('subservices.browsLashes.browCorrection'), t('subservices.browsLashes.browColor'), t('subservices.browsLashes.lashExtensions'), t('subservices.browsLashes.lamination'), otherSubserviceLabel],
        COSMETOLOGY: [t('subservices.cosmetology.cleaning'), t('subservices.cosmetology.peeling'), t('subservices.cosmetology.care'), otherSubserviceLabel],
        MASSAGE: [t('subservices.massage.classic'), t('subservices.massage.sport'), t('subservices.massage.relax'), otherSubserviceLabel],
        OTHER: [],
    }), [otherSubserviceLabel, t]);
    const languageLabels = useMemo<Record<ProviderLanguage, string>>(
        () => PROVIDER_LANGUAGE_OPTIONS.reduce((acc, option) => {
            if (option.code === 'ru') acc[option.value] = t('languages.ru');
            if (option.code === 'uk') acc[option.value] = t('languages.uk');
            if (option.code === 'de') acc[option.value] = t('languages.de');
            if (option.code === 'en') acc[option.value] = t('languages.en');
            return acc;
        }, {} as Record<ProviderLanguage, string>),
        [t],
    );
    const stepMeta = useMemo(() => {
        if (safeFlowType === 'SALON') {
            switch (currentStep) {
                case 1:
                    return { label: t('steps.SALON.1.label'), title: t('steps.SALON.1.title') };
                case 2:
                    return { label: t('steps.SALON.2.label'), title: t('steps.SALON.2.title'), subtitle: t('steps.SALON.2.subtitle') };
                case 3:
                    return { label: t('steps.SALON.3.label'), title: t('steps.SALON.3.title'), subtitle: t('steps.SALON.3.subtitle') };
                case 4:
                    return { label: t('steps.SALON.4.label'), title: t('steps.SALON.4.title') };
                case 5:
                    return { label: t('steps.SALON.5.label'), title: t('steps.SALON.5.title') };
            }
        }

        switch (currentStep) {
            case 1:
                return { label: t('steps.INDIVIDUAL.1.label'), title: t('steps.INDIVIDUAL.1.title'), subtitle: t('steps.INDIVIDUAL.1.subtitle') };
            case 2:
                return { label: t('steps.INDIVIDUAL.2.label'), title: t('steps.INDIVIDUAL.2.title') };
            case 3:
                return { label: t('steps.INDIVIDUAL.3.label'), title: t('steps.INDIVIDUAL.3.title') };
            case 4:
                return { label: t('steps.INDIVIDUAL.4.label'), title: t('steps.INDIVIDUAL.4.title'), subtitle: t('steps.INDIVIDUAL.4.subtitle') };
            case 5:
                return { label: t('steps.INDIVIDUAL.5.label'), title: t('steps.INDIVIDUAL.5.title') };
        }
    }, [currentStep, safeFlowType, t]);
    const activeDays = useMemo(() => days.filter((day) => wizard.step5[day.id].enabled), [days, wizard.step5]);
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

    const invalidActiveDayIds = useMemo(
        () =>
            activeDays
                .filter((day) => {
                    const start = parseTimeToMinutes(wizard.step5[day.id].start);
                    const end = parseTimeToMinutes(wizard.step5[day.id].end);
                    return start === null || end === null || end <= start;
                })
                .map((day) => day.id),
        [activeDays, wizard.step5]
    );

    const validActiveDayTimes = useMemo(
        () => invalidActiveDayIds.length === 0,
        [invalidActiveDayIds]
    );

    const normalizedPriceValue = normalizePriceInput(wizard.step4.price.trim());
    const parsedPrice = normalizedPriceValue === '' ? Number.NaN : Number(normalizedPriceValue);
    const isStep1Valid = safeFlowType === 'SALON'
        ? wizard.step1.profileName.trim().length > 0 &&
            wizard.step1.bio.trim().length > 0 &&
            wizard.step1.managerName.trim().length > 0
        : wizard.step1.profileName.trim().length > 0;

    const isStep2Valid = safeFlowType === 'SALON'
        ? wizard.step2.categoryIds.length > 0 && wizard.step2.languages.length > 0
        : wizard.step2.audiences.length > 0 && wizard.step2.languages.length > 0;

    const hasAnyServiceMode = wizard.step3.providesInStudio || wizard.step3.providesOutcall;
    const hasValidOutcallRadius =
        Number(wizard.step3.outcallRadiusKm) >= OUTCALL_RADIUS_MIN &&
        Number(wizard.step3.outcallRadiusKm) <= OUTCALL_RADIUS_MAX;
    const hasValidInStudioLocation = safeFlowType === 'SALON'
        ? hasSelectedCity(wizard.step3.city) &&
            wizard.step3.street.trim().length > 0 &&
            wizard.step3.houseNumber.trim().length > 0 &&
            wizard.step3.zipCode.trim().length > 0
        : wizard.step3.workLocations.length > 0 &&
            wizard.step3.workLocations.every(
                (location) =>
                    hasSelectedCity(location.city) &&
                    location.street.trim().length > 0 &&
                    location.houseNumber.trim().length > 0 &&
                    location.zipCode.trim().length > 0
            );
    const hasValidOutcallBase = wizard.step3.providesInStudio || (
        hasSelectedCity(wizard.step3.city)
    );
    const isStep3Valid = hasAnyServiceMode &&
        (!wizard.step3.providesInStudio || hasValidInStudioLocation) &&
        (!wizard.step3.providesOutcall || (hasValidOutcallRadius && hasValidOutcallBase));

    const isStep4Valid = safeFlowType === 'SALON'
        ? wizard.step4.title.trim().length > 0 &&
            wizard.step4.duration.trim().length > 0 &&
            wizard.step4.price.trim().length > 0 &&
            !Number.isNaN(parsedPrice) &&
            parsedPrice > 0
        : wizard.step4.serviceCategory.length > 0 &&
            (wizard.step4.serviceCategory !== 'OTHER' || wizard.step4.otherCategoryDetail.trim().length > 0) &&
            wizard.step4.title.trim().length > 0 &&
            wizard.step4.price.trim().length > 0 &&
            !Number.isNaN(parsedPrice) &&
            parsedPrice > 0;

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

    const updateWorkLocation = (index: number, patch: Partial<WorkLocationInput>) => {
        setWizard((prev) => {
            const nextLocations = [...prev.step3.workLocations];
            nextLocations[index] = {
                ...nextLocations[index],
                ...patch,
            };
            return {
                ...prev,
                step3: {
                    ...prev.step3,
                    workLocations: nextLocations,
                },
            };
        });
    };

    const addWorkLocation = () => {
        setWizard((prev) => ({
            ...prev,
            step3: {
                ...prev.step3,
                workLocations: [...prev.step3.workLocations, createEmptyWorkLocation()],
            },
        }));
    };

    const removeWorkLocation = (index: number) => {
        setWizard((prev) => {
            if (prev.step3.workLocations.length <= 1) return prev;
            return {
                ...prev,
                step3: {
                    ...prev.step3,
                    workLocations: prev.step3.workLocations.filter((_, itemIndex) => itemIndex !== index),
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
            setStepError(t('errors.photoUpload'));
            event.target.value = '';
            return;
        }

        try {
            const previewUrl = URL.createObjectURL(file);
            updateStep1({
                avatarFile: file,
                avatarPreviewUrl: previewUrl,
            });
            setStepError(null);
            setError(null);
        } catch {
            setStepError(t('errors.photoUpload'));
        }

        event.target.value = '';
    };

    const handleServiceImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] || null;
        if (!file) return;

        if (!isAllowedImageType(file)) {
            setServiceImageError(t('errors.imageType'));
            event.target.value = '';
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setServiceImageError(t('errors.imageSize'));
            event.target.value = '';
            return;
        }

        try {
            if (wizard.step4.imagePreviewUrl?.startsWith('blob:')) {
                URL.revokeObjectURL(wizard.step4.imagePreviewUrl);
            }

            updateStep4({
                imageFile: file,
                imagePreviewUrl: URL.createObjectURL(file),
            });
            setServiceImageError(null);
            setError(null);
        } catch {
            setServiceImageError(t('errors.preview'));
        }

        event.target.value = '';
    };

    const removeAvatar = () => {
        updateStep1({
            avatarFile: null,
            avatarPreviewUrl: null,
        });
        setStepError(null);
    };

    const removeServiceImage = () => {
        if (wizard.step4.imagePreviewUrl?.startsWith('blob:')) {
            URL.revokeObjectURL(wizard.step4.imagePreviewUrl);
        }

        updateStep4({
            imageFile: null,
            imagePreviewUrl: null,
        });
        setServiceImageError(null);
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

    const selectServiceCategory = (category: ServiceCategoryKey) => {
        updateStep4({
            serviceCategory: category,
            serviceSubservice: '',
            otherCategoryDetail: category === 'OTHER' ? wizard.step4.otherCategoryDetail : '',
            title: '',
            price: '',
            isStartingPrice: false,
            duration: '60',
        });
    };

    const selectServiceSubservice = (subservice: string) => {
        updateStep4({
            serviceSubservice: subservice,
            title: subservice === otherSubserviceLabel ? '' : subservice,
            price: '',
            isStartingPrice: false,
            duration: '60',
        });
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
        const firstActive = days.find((day) => wizard.step5[day.id].enabled);
        if (!firstActive) return;
        const source = wizard.step5[firstActive.id];

        setWizard((prev) => {
            const next = { ...prev.step5 };
            days.forEach((day) => {
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

    const buildPreparedBio = () => {
        const managerName = wizard.step1.managerName.trim();
        const bio = wizard.step1.bio.trim();
        const normalizedWorkLocations = safeFlowType === 'INDIVIDUAL' && wizard.step3.providesInStudio
            ? wizard.step3.workLocations
                .map((location) => ({
                    placeName: location.placeName.trim(),
                    street: location.street.trim(),
                    houseNumber: location.houseNumber.trim(),
                    address: combineStreetAndHouse(location.street, location.houseNumber),
                    zipCode: location.zipCode.trim(),
                    city: location.city.trim(),
                    cityLatitude: location.cityLatitude,
                    cityLongitude: location.cityLongitude,
                    latitude: location.latitude,
                    longitude: location.longitude,
                    hideExactAddress: location.hideExactAddress,
                }))
                .filter((location) =>
                    location.placeName.length > 0 ||
                    location.street.length > 0 ||
                    location.houseNumber.length > 0 ||
                    location.zipCode.length > 0 ||
                    location.city.length > 0
                )
            : [];

        let preparedBio = safeFlowType === 'SALON'
            ? t('bioMeta.contactPerson', { name: managerName, bio }).trim()
            : bio;

        if (safeFlowType === 'INDIVIDUAL' && normalizedWorkLocations.length > 0) {
            const locationsSummary = normalizedWorkLocations
                .map((location, index) => {
                    const label = location.placeName || location.address || location.city;
                    return `${index + 1}. ${label} — ${location.city}`;
                })
                .join('\n');
            preparedBio = `${preparedBio}${preparedBio ? '\n\n' : ''}${t('bioMeta.workLocations')}:\n${locationsSummary}`;
        }

        return { preparedBio, normalizedWorkLocations };
    };

    const buildDraftFormData = (step: StepNumber, geocode: boolean = step >= 3) => {
        const providerType: ProviderTypePayload = safeFlowType === 'SALON' ? 'SALON' : 'INDIVIDUAL';
        const selectedCategoryId = safeFlowType === 'SALON'
            ? Number(selectedPrimaryCategoryId)
            : resolveCategoryIdFromServiceCategory(
                wizard.step4.serviceCategory,
                categories,
                initialProfile?.categoryId
            );
        const { preparedBio, normalizedWorkLocations } = buildPreparedBio();
        const primaryLocation = normalizedWorkLocations[0];
        const derivedCity = safeFlowType === 'SALON'
            ? wizard.step3.city.trim()
            : primaryLocation?.city || wizard.step3.city.trim();
        const derivedCityLatitude = safeFlowType === 'SALON'
            ? wizard.step3.cityLatitude
            : primaryLocation?.cityLatitude ?? wizard.step3.cityLatitude;
        const derivedCityLongitude = safeFlowType === 'SALON'
            ? wizard.step3.cityLongitude
            : primaryLocation?.cityLongitude ?? wizard.step3.cityLongitude;
        const derivedAddress = safeFlowType === 'SALON'
            ? combineStreetAndHouse(wizard.step3.street, wizard.step3.houseNumber)
            : primaryLocation?.address || '';
        const derivedAddressLatitude = safeFlowType === 'SALON'
            ? wizard.step3.addressLatitude
            : primaryLocation?.latitude ?? null;
        const derivedAddressLongitude = safeFlowType === 'SALON'
            ? wizard.step3.addressLongitude
            : primaryLocation?.longitude ?? null;
        const derivedZipCode = safeFlowType === 'SALON'
            ? wizard.step3.zipCode.trim()
            : primaryLocation?.zipCode || wizard.step3.zipCode.trim();
        const formData = new FormData();

        formData.set('step', String(step));
        formData.set('geocode', geocode ? 'true' : 'false');
        formData.set('name', wizard.step1.profileName.trim());
        formData.set('provider_type', providerType);
        formData.set('bio', preparedBio);
        formData.set('manager_name', wizard.step1.managerName.trim());
        formData.set('zip_code', derivedZipCode);
        formData.set('city_latitude', derivedCityLatitude != null ? String(derivedCityLatitude) : '');
        formData.set('city_longitude', derivedCityLongitude != null ? String(derivedCityLongitude) : '');
        formData.set('address_latitude', derivedAddressLatitude != null ? String(derivedAddressLatitude) : '');
        formData.set('address_longitude', derivedAddressLongitude != null ? String(derivedAddressLongitude) : '');
        formData.set('provides_in_studio', String(wizard.step3.providesInStudio));
        formData.set('provides_outcall', String(wizard.step3.providesOutcall));
        formData.set('outcall_radius_km', wizard.step3.providesOutcall ? wizard.step3.outcallRadiusKm : '');

        if (Number.isInteger(selectedCategoryId) && selectedCategoryId > 0) {
            formData.set('category_id', String(selectedCategoryId));
        }

        wizard.step2.languages.forEach((language) => {
            formData.append('languages', language);
        });
        wizard.step2.audiences.forEach((audience) => {
            formData.append('audiences', audience);
        });

        if (safeFlowType === 'SALON') {
            formData.set('city', derivedCity);
            formData.set('address', wizard.step3.providesInStudio ? derivedAddress : '');
        } else {
            formData.set('city', derivedCity);
            formData.set('address', wizard.step3.providesInStudio ? derivedAddress : '');
            formData.set(
                'work_locations',
                JSON.stringify(wizard.step3.providesInStudio ? normalizedWorkLocations : [])
            );
        }

        if (draftProfileId != null) {
            formData.set('profile_id', String(draftProfileId));
        }

        return formData;
    };

    const goBack = () => {
        setError(null);
        setStepError(null);
        setCurrentStep((prev) => (prev === 1 ? prev : ((prev - 1) as StepNumber)));
    };

    const goNext = async () => {
        if (!canGoNext || isSubmitting) return;
        if (stepError) {
            setError(t('errors.fixBeforeContinue'));
            return;
        }

        setIsSubmitting(true);
        setError(null);
        setStepError(null);
        setServiceImageError(null);

        try {
            const nextStep = (currentStep === 5 ? currentStep : ((currentStep + 1) as StepNumber));
            const draftResult = await saveProviderDraft(buildDraftFormData(nextStep, currentStep >= 3));
            if (!draftResult.success || !draftResult.profileId) {
                setError(draftResult.error || t('errors.saveDraft'));
                return;
            }

            setDraftProfileId(draftResult.profileId);
            setCurrentStep(nextStep);
        } finally {
            setIsSubmitting(false);
        }
    };

    const skipAvatarStep = async () => {
        updateStep1({
            avatarFile: null,
            avatarPreviewUrl: null,
        });
        setError(null);
        setStepError(null);
        await goNext();
    };

    const completeOnboarding = async () => {
        if (!isStep5Valid || isSubmitting) return;

        setIsSubmitting(true);
        setError(null);
        setSuccessMessage(null);

        try {
            const providerType: ProviderTypePayload = safeFlowType === 'SALON' ? 'SALON' : 'INDIVIDUAL';
            const profileName = wizard.step1.profileName.trim();
            const { normalizedWorkLocations } = buildPreparedBio();

            if (!hasAnyServiceMode) {
                setError(t('errors.selectWorkMode'));
                setIsSubmitting(false);
                return;
            }

            if (safeFlowType === 'INDIVIDUAL' && wizard.step3.providesInStudio && normalizedWorkLocations.length === 0) {
                setError(t('errors.addWorkLocation'));
                setIsSubmitting(false);
                return;
            }

            if (
                safeFlowType === 'INDIVIDUAL' &&
                wizard.step3.providesInStudio &&
                normalizedWorkLocations.some((location) =>
                    !hasSelectedCity(location.city) ||
                    !location.street ||
                    !location.houseNumber ||
                    !location.zipCode
                )
            ) {
                setError(t('errors.completeWorkLocations'));
                setIsSubmitting(false);
                return;
            }

            if (
                safeFlowType === 'SALON' &&
                wizard.step3.providesInStudio &&
                (
                    !hasSelectedCity(wizard.step3.city) ||
                    !wizard.step3.street.trim() ||
                    !wizard.step3.houseNumber.trim() ||
                    !wizard.step3.zipCode.trim()
                )
            ) {
                setError(t('errors.completeSalonAddress'));
                setIsSubmitting(false);
                return;
            }

            if (wizard.step3.providesOutcall && !hasValidOutcallBase) {
                setError(t('errors.outcallCity'));
                setIsSubmitting(false);
                return;
            }

            if (wizard.step3.providesOutcall && !hasValidOutcallRadius) {
                setError(t('errors.outcallRadius'));
                setIsSubmitting(false);
                return;
            }

            const primaryWorkLocation = normalizedWorkLocations[0];
            const city = safeFlowType === 'SALON'
                ? wizard.step3.city.trim()
                : primaryWorkLocation?.city || wizard.step3.city.trim();
            const address = safeFlowType === 'SALON'
                ? (wizard.step3.providesInStudio ? combineStreetAndHouse(wizard.step3.street, wizard.step3.houseNumber) : '')
                : (wizard.step3.providesInStudio ? primaryWorkLocation?.address || '' : '');
            const selectedCategoryId = safeFlowType === 'SALON'
                ? Number(selectedPrimaryCategoryId)
                : resolveCategoryIdFromServiceCategory(
                    wizard.step4.serviceCategory,
                    categories,
                    initialProfile?.categoryId
                );

            if (!Number.isInteger(selectedCategoryId) || selectedCategoryId <= 0) {
                setError(t('errors.category'));
                setIsSubmitting(false);
                return;
            }

            const serviceData = {
                category: wizard.step4.serviceCategory,
                subservice: wizard.step4.serviceSubservice,
                otherCategoryDetail: wizard.step4.otherCategoryDetail.trim(),
                title: wizard.step4.title.trim(),
                price: wizard.step4.price.trim(),
                isStartingPrice: wizard.step4.isStartingPrice,
                duration: wizard.step4.duration,
                description: wizard.step4.description.trim(),
                hasImage: Boolean(wizard.step4.imageFile),
            };
            const scheduleData = days
                .filter((day) => wizard.step5[day.id].enabled)
                .map((day) => ({
                    dayId: day.id,
                    dayLabel: day.label,
                    start: wizard.step5[day.id].start,
                    end: wizard.step5[day.id].end,
                }));

            console.log('SUBMITTING DATA:', {
                name: profileName,
                category: selectedCategoryId,
                city,
                address,
                zip: safeFlowType === 'SALON' ? wizard.step3.zipCode.trim() : primaryWorkLocation?.zipCode || wizard.step3.zipCode.trim(),
                services: serviceData,
                schedule: scheduleData,
            });

            const profileFormData = buildDraftFormData(5, true);
            const profileResult = await saveProviderDraft(profileFormData);
            if (!profileResult.success || !profileResult.profileId) {
                setError(profileResult.error || t('errors.saveProfileDraft'));
                setIsSubmitting(false);
                return;
            }

            const profileId = profileResult.profileId;
            setDraftProfileId(profileId);

            if (safeFlowType === 'INDIVIDUAL' && wizard.step1.avatarFile) {
                try {
                    const avatarFormData = new FormData();
                    avatarFormData.set('file', wizard.step1.avatarFile);
                    avatarFormData.set('profile_id', String(profileId));

                    const avatarUploadResult = await uploadAvatar(avatarFormData);
                    if (!avatarUploadResult.success) {
                        console.warn('Avatar upload failed, continuing without avatar:', avatarUploadResult.error);
                    }
                } catch (avatarError) {
                    console.warn('Avatar upload failed, continuing without avatar:', avatarError);
                }
            }

            let serviceImageUrl: string | null = null;
            if (wizard.step4.imageFile) {
                try {
                    const serviceImageFormData = new FormData();
                    serviceImageFormData.set('photo', wizard.step4.imageFile);

                    const serviceImageUploadResult = await uploadServicePhoto(serviceImageFormData);
                    if (serviceImageUploadResult.success && serviceImageUploadResult.imageUrl) {
                        serviceImageUrl = serviceImageUploadResult.imageUrl;
                    } else if (!serviceImageUploadResult.success) {
                        console.warn(
                            'Service image upload failed, continuing without service photo:',
                            serviceImageUploadResult.error,
                        );
                    }
                } catch (serviceImageUploadError) {
                    console.warn(
                        'Service image upload failed, continuing without service photo:',
                        serviceImageUploadError,
                    );
                }
            }

            const finalServiceTitle = wizard.step4.title.trim();
            if (!finalServiceTitle) {
                setError(t('errors.serviceTitle'));
                setIsSubmitting(false);
                return;
            }

            if (
                safeFlowType === 'INDIVIDUAL' &&
                wizard.step4.serviceCategory === 'OTHER' &&
                !wizard.step4.otherCategoryDetail.trim()
            ) {
                setError(t('errors.otherCategory'));
                setIsSubmitting(false);
                return;
            }

            const descriptionMeta: string[] = [];
            if (safeFlowType === 'INDIVIDUAL' && wizard.step4.serviceCategory === 'OTHER' && wizard.step4.otherCategoryDetail.trim()) {
                descriptionMeta.push(t('descriptionMeta.category', { value: wizard.step4.otherCategoryDetail.trim() }));
            }
            if (wizard.step4.isStartingPrice) {
                descriptionMeta.push(t('descriptionMeta.startingPrice'));
            }
            const finalServiceDescription = [wizard.step4.description.trim(), ...descriptionMeta].filter(Boolean).join('\n');

            const startMinutes = activeDays
                .map((day) => parseTimeToMinutes(wizard.step5[day.id].start))
                .filter((value): value is number => value !== null);

            const endMinutes = activeDays
                .map((day) => parseTimeToMinutes(wizard.step5[day.id].end))
                .filter((value): value is number => value !== null);

            const publishFormData = buildDraftFormData(5, true);
            publishFormData.set('profile_id', String(profileId));
            publishFormData.set('service_title', finalServiceTitle);
            publishFormData.set('service_price', String(parsedPrice));
            publishFormData.set('service_duration', wizard.step4.duration);
            if (finalServiceDescription) {
                publishFormData.set('service_description', finalServiceDescription);
            }
            if (serviceImageUrl) {
                publishFormData.set('service_image_url', serviceImageUrl);
            }
            publishFormData.set('start_time', minutesToTime(Math.min(...startMinutes)));
            publishFormData.set('end_time', minutesToTime(Math.max(...endMinutes)));
            activeDays.forEach((day) => {
                publishFormData.append('working_days', String(day.id));
            });

            const publishResult = await publishProviderProfile(publishFormData);
            if (!publishResult.success) {
                setError(publishResult.error || t('errors.publish'));
                setIsSubmitting(false);
                return;
            }

            setSuccessMessage(t('success'));
            await update({
                onboardingCompleted: true,
                onboardingType: null,
                profileId,
                profileStatus: 'PENDING_REVIEW',
            });
            router.replace('/dashboard');
            router.refresh();
        } catch (error) {
            console.error('ONBOARDING ERROR:', error);
            try {
                console.error('ERROR DETAILS:', JSON.stringify(error, null, 2));
            } catch {
                console.error('ERROR DETAILS: [unable to serialize error]');
            }
            setError(t('errors.finish'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const durationOptions = DURATION_OPTIONS;

    return (
        <main className="min-h-screen px-4 py-10">
            <div className="mx-auto w-full max-w-[600px]">
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xl sm:p-8">
                    <div className="mb-8">
                        <p className="text-sm font-medium text-gray-500">{t('progress', { current: currentStep, total: 5 })}</p>
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
                                        <label className="mb-2 block text-sm font-medium text-gray-700">{t('fields.name')}</label>
                                        <input
                                            type="text"
                                            value={wizard.step1.profileName}
                                            onChange={(event) => updateStep1({ profileName: event.target.value })}
                                            placeholder={t('placeholders.name')}
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
                                                    <span className="text-[11px] font-medium">{t('photo.add')}</span>
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
                                                {t('photo.remove')}
                                            </button>
                                        ) : null}
                                        <p className="mt-2 text-center text-xs text-gray-500">
                                            {t('photo.hint')}
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => void skipAvatarStep()}
                                            className="mt-2 text-xs font-medium text-slate-700 underline underline-offset-2 hover:text-slate-900"
                                        >
                                            {t('photo.skip')}
                                        </button>
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-gray-700">{t('fields.bio')}</label>
                                        <textarea
                                            rows={5}
                                            value={wizard.step1.bio}
                                            onChange={(event) => updateStep1({ bio: event.target.value })}
                                            placeholder={t('placeholders.bio')}
                                            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-gray-900"
                                        />
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {bioQuickTags.map((tag) => (
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
                                        <label className="mb-2 block text-sm font-medium text-gray-700">{t('fields.salonName')}</label>
                                        <input
                                            type="text"
                                            value={wizard.step1.profileName}
                                            onChange={(event) => updateStep1({ profileName: event.target.value })}
                                            placeholder={t('placeholders.salonName')}
                                            className="h-11 w-full rounded-xl border border-gray-300 px-3 text-sm text-gray-900 outline-none transition focus:border-gray-900"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-gray-700">{t('fields.salonBio')}</label>
                                        <textarea
                                            rows={5}
                                            value={wizard.step1.bio}
                                            onChange={(event) => updateStep1({ bio: event.target.value })}
                                            placeholder={t('placeholders.salonBio')}
                                            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-gray-900"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-gray-700">
                                            {t('fields.managerName')}
                                        </label>
                                        <input
                                            type="text"
                                            value={wizard.step1.managerName}
                                            onChange={(event) => updateStep1({ managerName: event.target.value })}
                                            placeholder={t('placeholders.managerName')}
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
                                        <p className="mb-2 text-sm font-medium text-gray-700">{t('fields.audiences')}</p>
                                        <div className="flex flex-wrap gap-2">
                                            {audienceOptions.map((option) => (
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
                                    <p className="mb-2 block text-sm font-medium text-gray-700">{t('fields.categories')}</p>
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
                                <p className="mb-2 text-sm font-medium text-gray-700">{t('fields.languages')}</p>
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
                                            <span>{languageLabels[option.value]}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </section>
                    ) : null}

                    {currentStep === 3 ? (
                        <section className="space-y-5">
                            <div className="space-y-3">
                                <p className="text-sm font-medium text-gray-700">{t('fields.workMode')}</p>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-gray-300 px-4 py-4 text-sm text-gray-700 transition hover:border-gray-400">
                                        <input
                                            type="checkbox"
                                            checked={wizard.step3.providesInStudio}
                                            onChange={(event) => updateStep3({ providesInStudio: event.target.checked })}
                                            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-slate-900 focus:ring-slate-300"
                                        />
                                        <span>
                                            <span className="block font-medium text-gray-900">{t('workMode.studioTitle')}</span>
                                            <span className="mt-1 block text-xs text-gray-500">{t('workMode.studioBody')}</span>
                                        </span>
                                    </label>
                                    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-gray-300 px-4 py-4 text-sm text-gray-700 transition hover:border-gray-400">
                                        <input
                                            type="checkbox"
                                            checked={wizard.step3.providesOutcall}
                                            onChange={(event) => updateStep3({ providesOutcall: event.target.checked })}
                                            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-slate-900 focus:ring-slate-300"
                                        />
                                        <span>
                                            <span className="block font-medium text-gray-900">{t('workMode.outcallTitle')}</span>
                                            <span className="mt-1 block text-xs text-gray-500">{t('workMode.outcallBody')}</span>
                                        </span>
                                    </label>
                                </div>
                            </div>

                            {!hasAnyServiceMode ? (
                                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                                    {t('workMode.required')}
                                </div>
                            ) : null}

                            {safeFlowType === 'INDIVIDUAL' ? (
                                <>
                                    {wizard.step3.providesInStudio ? (
                                        <>
                                            <div className="space-y-4">
                                                {wizard.step3.workLocations.map((location, index) => (
                                                    <div key={`work-location-${index}`} className="rounded-xl border border-gray-300 p-4">
                                                        <div className="mb-3 flex items-center justify-between">
                                                            <p className="text-sm font-semibold text-gray-800">{t('location.itemTitle', { number: index + 1 })}</p>
                                                            {wizard.step3.workLocations.length > 1 ? (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeWorkLocation(index)}
                                                                    className="text-xs font-medium text-gray-500 underline underline-offset-2 hover:text-gray-700"
                                                                >
                                                                    {t('common.remove')}
                                                                </button>
                                                            ) : null}
                                                        </div>

                                                        <div className="space-y-3">
                                                            <div>
                                                                <label className="mb-2 block text-sm font-medium text-gray-700">{t('fields.placeName')}</label>
                                                                    <input
                                                                        type="text"
                                                                        value={location.placeName}
                                                                        onChange={(event) => updateWorkLocation(index, { placeName: event.target.value })}
                                                                    placeholder={t('placeholders.placeName')}
                                                                    className="h-11 w-full rounded-xl border border-gray-300 px-3 text-sm text-gray-900 outline-none transition focus:border-gray-900"
                                                                />
                                                                <div className="mt-2 flex flex-wrap gap-2">
                                                                    {placeNamePresets.map((preset) => (
                                                                        <button
                                                                            key={`${index}-${preset}`}
                                                                            type="button"
                                                                            onClick={() => updateWorkLocation(index, { placeName: preset })}
                                                                            className="rounded-full border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 transition hover:border-gray-400 hover:bg-gray-50"
                                                                        >
                                                                            {preset}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>

                                                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-10">
                                                                <div className="sm:col-span-7">
                                                                    <label className="mb-2 block text-sm font-medium text-gray-700">{t('fields.city')}</label>
                                                                    <CityCombobox
                                                                        name={`work-location-city-${index}`}
                                                                        value={location.city}
                                                                        onValueChange={(value) =>
                                                                            updateWorkLocation(index, {
                                                                                city: value,
                                                                                cityLatitude: null,
                                                                                cityLongitude: null,
                                                                                street: '',
                                                                                houseNumber: '',
                                                                                address: '',
                                                                                latitude: null,
                                                                                longitude: null,
                                                                            })
                                                                        }
                                                                        onCitySelect={(city) =>
                                                                            updateWorkLocation(index, {
                                                                                city: city.germanName,
                                                                                cityLatitude: city.lat,
                                                                                cityLongitude: city.lng,
                                                                                street: '',
                                                                                houseNumber: '',
                                                                                address: '',
                                                                                latitude: null,
                                                                                longitude: null,
                                                                            })
                                                                        }
                                                                        onZipCodeDetect={(zipCode) =>
                                                                            updateWorkLocation(index, { zipCode })
                                                                        }
                                                                        placeholder={t('placeholders.city')}
                                                                    />
                                                                </div>
                                                                <div className="sm:col-span-3">
                                                                    <label className="mb-2 block text-sm font-medium text-gray-700">{t('fields.zip')}</label>
                                                                    <input
                                                                        type="text"
                                                                        value={location.zipCode}
                                                                        onChange={(event) => updateWorkLocation(index, { zipCode: event.target.value })}
                                                                        className="h-11 w-full rounded-xl border border-gray-300 px-3 text-sm text-gray-900 outline-none transition focus:border-gray-900"
                                                                    />
                                                                </div>
                                                            </div>

                                                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                                                                <div className="sm:col-span-3">
                                                                    <label className="mb-2 block text-sm font-medium text-gray-700">{t('fields.street')}</label>
                                                                    <StreetAddressAutocomplete
                                                                        value={location.street}
                                                                        city={location.city}
                                                                        disabled={!hasSelectedCity(location.city)}
                                                                        isValidated={location.latitude != null && location.longitude != null}
                                                                        onValueChange={(value) =>
                                                                            updateWorkLocation(index, {
                                                                                street: value,
                                                                                address: combineStreetAndHouse(value, location.houseNumber),
                                                                                latitude: null,
                                                                                longitude: null,
                                                                            })
                                                                        }
                                                                    onSuggestionSelect={(suggestion) =>
                                                                        updateWorkLocation(index, {
                                                                            street: suggestion.streetName,
                                                                            address: combineStreetAndHouse(suggestion.streetName, location.houseNumber),
                                                                            latitude: suggestion.lat,
                                                                            longitude: suggestion.lon,
                                                                            zipCode: suggestion.postcode || '',
                                                                        })
                                                                    }
                                                                        placeholder={
                                                                            hasSelectedCity(location.city)
                                                                                ? t('placeholders.street')
                                                                                : t('placeholders.cityFirst')
                                                                        }
                                                                    />
                                                                </div>
                                                                <div className="sm:col-span-1">
                                                                    <label className="mb-2 block text-sm font-medium text-gray-700">{t('fields.house')}</label>
                                                                    <input
                                                                        type="text"
                                                                        value={location.houseNumber}
                                                                        onChange={(event) =>
                                                                            updateWorkLocation(index, {
                                                                                houseNumber: event.target.value,
                                                                                address: combineStreetAndHouse(location.street, event.target.value),
                                                                            })
                                                                        }
                                                                        disabled={!hasSelectedCity(location.city)}
                                                                        className="h-11 w-full rounded-xl border border-gray-300 px-3 text-sm text-gray-900 outline-none transition focus:border-gray-900 disabled:bg-gray-50 disabled:text-gray-400"
                                                                    />
                                                                </div>
                                                            </div>

                                                            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-gray-300 px-3 py-3 text-sm text-gray-700">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={location.hideExactAddress}
                                                                    onChange={(event) =>
                                                                        updateWorkLocation(index, { hideExactAddress: event.target.checked })
                                                                    }
                                                                    className="h-4 w-4 rounded border-gray-300 text-slate-900 focus:ring-slate-300"
                                                                />
                                                                {t('location.hideExact')}
                                                            </label>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            <button
                                                type="button"
                                                onClick={addWorkLocation}
                                                className="w-full rounded-xl border border-dashed border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                                            >
                                                {t('location.add')}
                                            </button>
                                            <p className="text-xs text-gray-500">
                                                {t('location.primaryHint')}
                                            </p>
                                        </>
                                    ) : null}

                                    {wizard.step3.providesOutcall ? (
                                        <div className="space-y-4 rounded-2xl border border-gray-300 p-4">
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{t('outcall.radius')}</p>
                                                <p className="mt-1 text-xs text-gray-500">
                                                    {t('outcall.radiusHint')}
                                                </p>
                                            </div>

                                            <div className="space-y-3">
                                                <input
                                                    type="range"
                                                    min={OUTCALL_RADIUS_MIN}
                                                    max={OUTCALL_RADIUS_MAX}
                                                    value={wizard.step3.outcallRadiusKm}
                                                    onChange={(event) => updateStep3({ outcallRadiusKm: event.target.value })}
                                                    className="w-full accent-slate-900"
                                                />
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-gray-500">{t('distanceKm', { count: OUTCALL_RADIUS_MIN })}</span>
                                                    <span className="rounded-full bg-slate-900 px-3 py-1 font-medium text-white">
                                                        {t('distanceKm', { count: Number(wizard.step3.outcallRadiusKm) })}
                                                    </span>
                                                    <span className="text-gray-500">{t('distanceKm', { count: OUTCALL_RADIUS_MAX })}</span>
                                                </div>
                                            </div>

                                            {!wizard.step3.providesInStudio ? (
                                                <div className="space-y-3">
                                                    <p className="text-sm font-medium text-gray-900">{t('outcall.baseCity')}</p>
                                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                                    <div>
                                                        <label className="mb-2 block text-sm font-medium text-gray-700">{t('fields.city')}</label>
                                                        <CityCombobox
                                                            name="outcall-base-city-individual"
                                                            value={wizard.step3.city}
                                                            onValueChange={(value) =>
                                                                updateStep3({
                                                                    city: value,
                                                                    cityLatitude: null,
                                                                    cityLongitude: null,
                                                                })
                                                            }
                                                            onCitySelect={(city) =>
                                                                updateStep3({
                                                                    city: city.germanName,
                                                                    cityLatitude: city.lat,
                                                                    cityLongitude: city.lng,
                                                                })
                                                            }
                                                            onZipCodeDetect={(zipCode) => updateStep3({ zipCode })}
                                                            placeholder={t('placeholders.city')}
                                                        />
                                                    </div>
                                                        <div>
                                                            <label className="mb-2 block text-sm font-medium text-gray-700">{t('fields.zip')}</label>
                                                            <input
                                                                type="text"
                                                                value={wizard.step3.zipCode}
                                                                onChange={(event) => updateStep3({ zipCode: event.target.value })}
                                                                className="h-11 w-full rounded-xl border border-gray-300 px-3 text-sm text-gray-900 outline-none transition focus:border-gray-900"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : null}
                                        </div>
                                    ) : null}
                                </>
                            ) : (
                                <>
                                    {wizard.step3.providesInStudio ? (
                                        <>
                                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-10">
                                                <div className="sm:col-span-7">
                                                    <label className="mb-2 block text-sm font-medium text-gray-700">{t('fields.city')}</label>
                                                    <CityCombobox
                                                        name="salon-city"
                                                        value={wizard.step3.city}
                                                        onValueChange={(value) =>
                                                            updateStep3({
                                                                city: value,
                                                                cityLatitude: null,
                                                                cityLongitude: null,
                                                                street: '',
                                                                houseNumber: '',
                                                                address: '',
                                                                addressLatitude: null,
                                                                addressLongitude: null,
                                                            })
                                                        }
                                                        onCitySelect={(city) =>
                                                            updateStep3({
                                                                city: city.germanName,
                                                                cityLatitude: city.lat,
                                                                cityLongitude: city.lng,
                                                                street: '',
                                                                houseNumber: '',
                                                                address: '',
                                                                addressLatitude: null,
                                                                addressLongitude: null,
                                                            })
                                                        }
                                                        onZipCodeDetect={(zipCode) => updateStep3({ zipCode })}
                                                        placeholder={t('placeholders.city')}
                                                    />
                                                </div>
                                                <div className="sm:col-span-3">
                                                    <label className="mb-2 block text-sm font-medium text-gray-700">{t('fields.zip')}</label>
                                                    <input
                                                        type="text"
                                                        value={wizard.step3.zipCode}
                                                        onChange={(event) => updateStep3({ zipCode: event.target.value })}
                                                        className="h-11 w-full rounded-xl border border-gray-300 px-3 text-sm text-gray-900 outline-none transition focus:border-gray-900"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                                                <div className="sm:col-span-3">
                                                    <label className="mb-2 block text-sm font-medium text-gray-700">{t('fields.street')}</label>
                                                    <StreetAddressAutocomplete
                                                        value={wizard.step3.street}
                                                        city={wizard.step3.city}
                                                        disabled={!hasSelectedCity(wizard.step3.city)}
                                                        isValidated={
                                                            wizard.step3.addressLatitude != null &&
                                                            wizard.step3.addressLongitude != null
                                                        }
                                                        onValueChange={(value) =>
                                                            updateStep3({
                                                                street: value,
                                                                address: combineStreetAndHouse(value, wizard.step3.houseNumber),
                                                                addressLatitude: null,
                                                                addressLongitude: null,
                                                            })
                                                        }
                                                        onSuggestionSelect={(suggestion) =>
                                                            updateStep3({
                                                                street: suggestion.streetName,
                                                                address: combineStreetAndHouse(suggestion.streetName, wizard.step3.houseNumber),
                                                                addressLatitude: suggestion.lat,
                                                                addressLongitude: suggestion.lon,
                                                                zipCode: suggestion.postcode || '',
                                                            })
                                                        }
                                                        placeholder={
                                                            hasSelectedCity(wizard.step3.city)
                                                                ? t('placeholders.street')
                                                                : t('placeholders.cityFirst')
                                                        }
                                                    />
                                                </div>
                                                <div className="sm:col-span-1">
                                                    <label className="mb-2 block text-sm font-medium text-gray-700">{t('fields.house')}</label>
                                                    <input
                                                        type="text"
                                                        value={wizard.step3.houseNumber}
                                                        onChange={(event) =>
                                                            updateStep3({
                                                                houseNumber: event.target.value,
                                                                address: combineStreetAndHouse(wizard.step3.street, event.target.value),
                                                            })
                                                        }
                                                        disabled={!hasSelectedCity(wizard.step3.city)}
                                                        className="h-11 w-full rounded-xl border border-gray-300 px-3 text-sm text-gray-900 outline-none transition focus:border-gray-900 disabled:bg-gray-50 disabled:text-gray-400"
                                                    />
                                                </div>
                                            </div>
                                        </>
                                    ) : null}

                                    {wizard.step3.providesOutcall ? (
                                        <div className="space-y-4 rounded-2xl border border-gray-300 p-4">
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{t('outcall.radius')}</p>
                                                <p className="mt-1 text-xs text-gray-500">
                                                    {t('outcall.radiusHint')}
                                                </p>
                                            </div>

                                            <div className="space-y-3">
                                                <input
                                                    type="range"
                                                    min={OUTCALL_RADIUS_MIN}
                                                    max={OUTCALL_RADIUS_MAX}
                                                    value={wizard.step3.outcallRadiusKm}
                                                    onChange={(event) => updateStep3({ outcallRadiusKm: event.target.value })}
                                                    className="w-full accent-slate-900"
                                                />
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-gray-500">{t('distanceKm', { count: OUTCALL_RADIUS_MIN })}</span>
                                                    <span className="rounded-full bg-slate-900 px-3 py-1 font-medium text-white">
                                                        {t('distanceKm', { count: Number(wizard.step3.outcallRadiusKm) })}
                                                    </span>
                                                    <span className="text-gray-500">{t('distanceKm', { count: OUTCALL_RADIUS_MAX })}</span>
                                                </div>
                                            </div>

                                            {!wizard.step3.providesInStudio ? (
                                                <div className="space-y-3">
                                                    <p className="text-sm font-medium text-gray-900">{t('outcall.baseCity')}</p>
                                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                                        <div>
                                                            <label className="mb-2 block text-sm font-medium text-gray-700">{t('fields.city')}</label>
                                                            <CityCombobox
                                                                name="outcall-base-city-salon"
                                                                value={wizard.step3.city}
                                                                onValueChange={(value) =>
                                                                    updateStep3({
                                                                        city: value,
                                                                        cityLatitude: null,
                                                                        cityLongitude: null,
                                                                    })
                                                                }
                                                                onCitySelect={(city) =>
                                                                    updateStep3({
                                                                        city: city.germanName,
                                                                        cityLatitude: city.lat,
                                                                        cityLongitude: city.lng,
                                                                    })
                                                                }
                                                                onZipCodeDetect={(zipCode) => updateStep3({ zipCode })}
                                                                placeholder={t('placeholders.city')}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="mb-2 block text-sm font-medium text-gray-700">{t('fields.zip')}</label>
                                                            <input
                                                                type="text"
                                                                value={wizard.step3.zipCode}
                                                                onChange={(event) => updateStep3({ zipCode: event.target.value })}
                                                                className="h-11 w-full rounded-xl border border-gray-300 px-3 text-sm text-gray-900 outline-none transition focus:border-gray-900"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : null}
                                        </div>
                                    ) : null}
                                </>
                            )}
                        </section>
                    ) : null}

                    {currentStep === 4 ? (
                        <section className="space-y-5">
                            {safeFlowType === 'INDIVIDUAL' ? (
                                <>
                                    <div>
                                        <p className="mb-2 text-sm font-medium text-gray-700">{t('service.categoryStep')}</p>
                                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                                            {serviceCategoryOptions.map((option) => {
                                                const selected = wizard.step4.serviceCategory === option.value;
                                                return (
                                                    <button
                                                        key={option.value}
                                                        type="button"
                                                        onClick={() => selectServiceCategory(option.value)}
                                                        aria-pressed={selected}
                                                        className={`relative rounded-2xl border-2 px-3 py-3 text-left transition ${
                                                            selected
                                                                ? 'border-slate-900 bg-slate-50 text-slate-900 ring-2 ring-slate-200 shadow-sm'
                                                                : 'border-gray-300 bg-white text-gray-800 hover:border-gray-400'
                                                        }`}
                                                    >
                                                        <span
                                                            className={`absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-full border transition ${
                                                                selected
                                                                    ? 'border-slate-900 bg-slate-900 text-white'
                                                                    : 'border-gray-200 bg-white text-transparent'
                                                            }`}
                                                        >
                                                            <Check className="h-3.5 w-3.5" />
                                                        </span>
                                                        <div className="text-base">{option.icon}</div>
                                                        <div className="mt-1 text-sm font-medium">{option.label}</div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {wizard.step4.serviceCategory === 'OTHER' ? (
                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                                {t('service.otherCategory')}
                                            </label>
                                            <input
                                                type="text"
                                                value={wizard.step4.otherCategoryDetail}
                                                onChange={(event) => updateStep4({ otherCategoryDetail: event.target.value })}
                                                placeholder={t('placeholders.otherCategory')}
                                                className="h-11 w-full rounded-xl border border-gray-300 px-3 text-sm text-gray-900 outline-none transition focus:border-gray-900"
                                            />
                                        </div>
                                    ) : null}

                                    {wizard.step4.serviceCategory && wizard.step4.serviceCategory !== 'OTHER' ? (
                                        <div>
                                            <p className="mb-2 text-sm font-medium text-gray-700">{t('service.subserviceStep')}</p>
                                            <div className="flex flex-wrap gap-2">
                                                {serviceSubservices[wizard.step4.serviceCategory].map((subservice) => {
                                                    const selected = wizard.step4.serviceSubservice === subservice;
                                                    return (
                                                        <button
                                                            key={subservice}
                                                            type="button"
                                                            onClick={() => selectServiceSubservice(subservice)}
                                                            className={`rounded-full border px-3 py-1.5 text-sm transition ${
                                                                selected
                                                                    ? 'border-slate-900 bg-slate-900 text-white'
                                                                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                                                            }`}
                                                        >
                                                            {subservice}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ) : null}

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-gray-700">{t('fields.serviceTitle')}</label>
                                        <input
                                            type="text"
                                            value={wizard.step4.title}
                                            onChange={(event) => updateStep4({ title: event.target.value })}
                                            placeholder={t('placeholders.serviceTitle')}
                                            className="h-11 w-full rounded-xl border border-gray-300 px-3 text-sm text-gray-900 outline-none transition focus:border-gray-900"
                                        />
                                    </div>
                                </>
                            ) : (
                                <div className="relative">
                                    <label className="mb-2 block text-sm font-medium text-gray-700">{t('fields.serviceTitle')}</label>
                                    <input
                                        type="text"
                                        value={wizard.step4.title}
                                        onChange={(event) => updateStep4({ title: event.target.value })}
                                        onFocus={() => setShowServiceSuggestions(true)}
                                        onBlur={() => {
                                            setTimeout(() => setShowServiceSuggestions(false), 120);
                                        }}
                                        placeholder={t('placeholders.serviceTitle')}
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
                                                            onClick={() => updateStep4({ title: serviceTitle })}
                                                            className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                                                        >
                                                            {serviceTitle}
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ) : null}
                                </div>
                            )}

                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">{t('fields.price')}</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    inputMode="decimal"
                                    value={wizard.step4.price}
                                    onChange={(event) => updateStep4({ price: normalizePriceInput(event.target.value) })}
                                    onWheel={(event) => event.currentTarget.blur()}
                                    placeholder={t('placeholders.price')}
                                    className="h-11 w-full rounded-xl border border-gray-300 px-3 text-sm text-gray-900 outline-none transition focus:border-gray-900"
                                />
                                <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                                    <input
                                        type="checkbox"
                                        checked={wizard.step4.isStartingPrice}
                                        onChange={(event) => updateStep4({ isStartingPrice: event.target.checked })}
                                        className="h-4 w-4 rounded border-gray-300 text-slate-900 focus:ring-slate-300"
                                    />
                                    <span>{t('service.startingPrice')}</span>
                                </label>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">{t('fields.duration')}</label>
                                <select
                                    value={wizard.step4.duration}
                                    onChange={(event) => updateStep4({ duration: event.target.value })}
                                    className="h-11 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-gray-900"
                                >
                                    {durationOptions.map((duration) => (
                                        <option key={duration} value={duration}>
                                            {t('durationMin', { count: duration })}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">{t('fields.descriptionOptional')}</label>
                                <textarea
                                    rows={4}
                                    value={wizard.step4.description}
                                    onChange={(event) => updateStep4({ description: event.target.value })}
                                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-gray-900"
                                />
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">
                                        {t('photo.servicePhoto')}
                                    </label>
                                    <p className="text-xs text-gray-500">
                                        {t('photo.servicePhotoHint')}
                                    </p>
                                </div>

                                {wizard.step4.imagePreviewUrl ? (
                                    <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
                                        <img
                                            src={wizard.step4.imagePreviewUrl}
                                            alt={t('photo.servicePreviewAlt')}
                                            className="h-56 w-full object-cover"
                                        />
                                        <button
                                            type="button"
                                            onClick={removeServiceImage}
                                            className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/65 text-white transition hover:bg-black/80"
                                            aria-label={t('photo.remove')}
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                ) : null}

                                <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center transition hover:border-gray-400 hover:bg-gray-100/70">
                                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-gray-700 shadow-sm">
                                        <Upload className="h-5 w-5" />
                                    </span>
                                    <span className="mt-3 text-sm font-medium text-gray-900">
                                        {wizard.step4.imagePreviewUrl ? t('photo.replace') : t('photo.choose')}
                                    </span>
                                    <span className="mt-1 text-xs text-gray-500">
                                        {t('photo.formats')}
                                    </span>
                                    <input
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        className="hidden"
                                        onChange={handleServiceImageChange}
                                    />
                                </label>

                                {serviceImageError ? (
                                    <p className="text-sm text-red-600">{serviceImageError}</p>
                                ) : null}
                            </div>
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
                                    {t('schedule.weekdayPreset')}
                                </button>
                            ) : null}

                            {days.map((day) => {
                                const dayState = wizard.step5[day.id];
                                const hasInvalidTimeRange = invalidActiveDayIds.includes(day.id);
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
                                            <span>{t('schedule.workingDay')}</span>
                                        </label>

                                        {dayState.enabled ? (
                                            <div className="mt-3">
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="mb-1 block text-xs uppercase text-gray-500">{t('schedule.from')}</label>
                                                        <input
                                                            type="time"
                                                            value={dayState.start}
                                                            onChange={(event) => updateDay(day.id, { start: event.target.value })}
                                                            className={`h-10 w-full rounded-lg border px-3 text-sm text-gray-900 outline-none transition focus:border-gray-900 ${
                                                                hasInvalidTimeRange ? 'border-red-300' : 'border-gray-300'
                                                            }`}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="mb-1 block text-xs uppercase text-gray-500">{t('schedule.to')}</label>
                                                        <input
                                                            type="time"
                                                            value={dayState.end}
                                                            onChange={(event) => updateDay(day.id, { end: event.target.value })}
                                                            className={`h-10 w-full rounded-lg border px-3 text-sm text-gray-900 outline-none transition focus:border-gray-900 ${
                                                                hasInvalidTimeRange ? 'border-red-300' : 'border-gray-300'
                                                            }`}
                                                        />
                                                    </div>
                                                </div>

                                                {hasInvalidTimeRange ? (
                                                    <p className="mt-2 text-xs text-red-600">
                                                        {t('schedule.invalidRange')}
                                                    </p>
                                                ) : null}
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
                                    {t('schedule.applyToAll')}
                                </button>
                            ) : null}

                            <p className="text-xs text-gray-500">
                                {t('schedule.saveHint')}
                            </p>
                            <p className="text-xs text-gray-500">
                                {t('schedule.breaksHint')}
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
                                {t('navigation.back')}
                            </button>
                        ) : (
                            <div />
                        )}

                        {currentStep < 5 ? (
                            <button
                                type="button"
                                onClick={() => void goNext()}
                                disabled={!canGoNext || isSubmitting}
                                className="h-11 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 disabled:hover:bg-slate-200"
                            >
                                {t('navigation.next')}
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={() => void completeOnboarding()}
                                disabled={!isStep5Valid || isSubmitting}
                                className="inline-flex h-11 items-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                                {t('navigation.finish')}
                            </button>
                        )}
                    </div>
                    {stepError && (
                        <p style={{ color: 'red', fontSize: '13px', marginTop: '8px' }}>
                            {stepError}
                        </p>
                    )}
                </div>
            </div>
        </main>
    );
}
