import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock dependencies BEFORE importing the module under test ──
vi.mock('@/lib/prisma', () => ({
    default: {
        profile: {
            findFirst: vi.fn(),
            findUnique: vi.fn(),
            update: vi.fn(),
            create: vi.fn(),
        },
        category: { findFirst: vi.fn() },
        service: { deleteMany: vi.fn(), create: vi.fn() },
        user: {
            findUnique: vi.fn(),
            update: vi.fn(),
        },
        $transaction: vi.fn(),
    },
}));

vi.mock('@/auth', () => ({
    auth: vi.fn(),
}));

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}));

vi.mock('@/lib/geocode', () => ({
    geocodeAddress: vi.fn(),
}));

vi.mock('@/lib/slugify', () => ({
    slugify: vi.fn((text: string) => text.toLowerCase().replace(/\s+/g, '-')),
    deslugify: vi.fn((slug: string) => slug),
    createBaseSlug: vi.fn((name: string, city: string) => `${name}-${city}`.toLowerCase().replace(/\s+/g, '-')),
    generateUniqueProfileSlug: vi.fn().mockResolvedValue('test-slug-berlin'),
}));

import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { publishProviderProfile } from '@/app/actions/providerOnboarding';

const mockAuth = vi.mocked(auth);
const mockPrisma = vi.mocked(prisma);

function createFormData(overrides: Record<string, string | string[]> = {}): FormData {
    const defaults: Record<string, string | string[]> = {
        profile_id: '1',
        name: 'Test Master',
        city: 'Berlin',
        address: 'Friedrichstraße 100',
        provider_type: 'PRIVATE',
        bio: 'Test bio',
        category_id: '1',
        service_title: 'Haircut',
        service_description: 'A great haircut',
        service_price: '50',
        service_duration: '60',
        start_time: '09:00',
        end_time: '18:00',
        working_days: ['1', '2', '3', '4', '5'],
        step: '5',
    };

    const merged = { ...defaults, ...overrides };
    const fd = new FormData();

    for (const [key, value] of Object.entries(merged)) {
        if (Array.isArray(value)) {
            for (const item of value) {
                fd.append(key, item);
            }
        } else {
            fd.set(key, value);
        }
    }

    return fd;
}

// ──────────────────────────────────────────────────────────
// Suite 5.1 — taxId (Steuernummer) Requirement
// ──────────────────────────────────────────────────────────
describe('publishProviderProfile — taxId requirement', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockAuth.mockResolvedValue({
            user: { id: 'user-1', email: 'test@example.com', name: 'Test', role: 'USER' },
        } as any);
    });

    it('rejects when user.taxId is null', async () => {
        // saveProviderDraft will return a profileId
        mockPrisma.profile.findFirst.mockResolvedValue({
            id: 1,
            slug: 'existing',
            user_id: 'user-1',
            user_email: 'test@example.com',
            name: 'Test',
            city: 'Berlin',
            status: 'DRAFT',
            attributes: {},
            languages: [],
            latitude: 52.52,
            longitude: 13.4,
            category_id: 1,
            provider_type: 'PRIVATE',
            address: 'Test',
            bio: 'test',
            providesInStudio: true,
            providesOutcall: false,
            outcallRadiusKm: null,
        } as any);
        mockPrisma.category.findFirst.mockResolvedValue({ id: 1 } as any);
        mockPrisma.profile.update.mockResolvedValue({ id: 1 } as any);

        // taxId is null
        mockPrisma.user.findUnique.mockResolvedValue({ taxId: null } as any);

        const result = await publishProviderProfile(createFormData());
        expect(result.success).toBe(false);
        expect(result.error).toContain('Steuernummer');
    });

    it('rejects when user.taxId is whitespace only', async () => {
        mockPrisma.profile.findFirst.mockResolvedValue({
            id: 1,
            slug: 'existing',
            user_id: 'user-1',
            user_email: 'test@example.com',
            name: 'Test',
            city: 'Berlin',
            status: 'DRAFT',
            attributes: {},
            languages: [],
            latitude: 52.52,
            longitude: 13.4,
            category_id: 1,
            provider_type: 'PRIVATE',
            address: 'Test',
            bio: 'test',
            providesInStudio: true,
            providesOutcall: false,
            outcallRadiusKm: null,
        } as any);
        mockPrisma.category.findFirst.mockResolvedValue({ id: 1 } as any);
        mockPrisma.profile.update.mockResolvedValue({ id: 1 } as any);

        mockPrisma.user.findUnique.mockResolvedValue({ taxId: '   ' } as any);

        const result = await publishProviderProfile(createFormData());
        expect(result.success).toBe(false);
        expect(result.error).toContain('Steuernummer');
    });
});

// ──────────────────────────────────────────────────────────
// Suite 5.2 — Input Validation
// ──────────────────────────────────────────────────────────
describe('publishProviderProfile — input validation', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockAuth.mockResolvedValue({
            user: { id: 'user-1', email: 'test@example.com', name: 'Test', role: 'USER' },
        } as any);
    });

    it('rejects missing service_title', async () => {
        const fd = createFormData({ service_title: '' });
        const result = await publishProviderProfile(fd);
        expect(result.success).toBe(false);
        expect(result.error).toContain('услугу');
    });

    it('rejects missing working_days', async () => {
        const fd = createFormData();
        // Remove all working_days
        fd.delete('working_days');
        const result = await publishProviderProfile(fd);
        expect(result.success).toBe(false);
        expect(result.error).toContain('расписание');
    });

    it('rejects missing start_time', async () => {
        const fd = createFormData({ start_time: '' });
        const result = await publishProviderProfile(fd);
        expect(result.success).toBe(false);
        expect(result.error).toContain('расписание');
    });
});

// ──────────────────────────────────────────────────────────
// Suite 5.3 — Already Published Guard
// ──────────────────────────────────────────────────────────
describe('publishProviderProfile — already published guard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockAuth.mockResolvedValue({
            user: { id: 'user-1', email: 'test@example.com', name: 'Test', role: 'USER' },
        } as any);
    });

    it('short-circuits saveProviderDraft when profile is already PUBLISHED', async () => {
        // saveProviderDraft will find the profile and immediately return { success: true, profileId: 1 }
        // without overwriting the profile's fields (no update call in saveProviderDraft).
        // However, publishProviderProfile DOES still continue after saveProviderDraft returns:
        // it calls findUnique, checks ownership/coordinates, and runs $transaction.
        mockPrisma.profile.findFirst.mockResolvedValue({
            id: 1,
            slug: 'existing',
            user_id: 'user-1',
            user_email: 'test@example.com',
            name: 'Test',
            city: 'Berlin',
            status: 'PUBLISHED',
            attributes: {},
            languages: [],
            latitude: 52.52,
            longitude: 13.4,
            category_id: 1,
            provider_type: 'PRIVATE',
            address: 'Test',
            bio: 'test',
            providesInStudio: true,
            providesOutcall: false,
            outcallRadiusKm: null,
        } as any);

        // taxId check runs before saveProviderDraft
        mockPrisma.user.findUnique.mockResolvedValue({ taxId: 'DE123456789' } as any);

        // After saveProviderDraft returns, publishProviderProfile calls findUnique
        mockPrisma.profile.findUnique.mockResolvedValue({
            id: 1,
            user_id: 'user-1',
            user_email: 'test@example.com',
            slug: 'existing',
            attributes: {},
            latitude: 52.52,
            longitude: 13.4,
        } as any);

        // The $transaction will be called for the actual publish
        mockPrisma.$transaction.mockImplementation(async (callback: any) => {
            const tx = {
                service: { deleteMany: vi.fn().mockResolvedValue({}) },
                profile: { update: vi.fn().mockResolvedValue({ id: 1, slug: 'existing' }) },
                user: { update: vi.fn().mockResolvedValue({}) },
            };
            tx.service.create = vi.fn().mockResolvedValue({});
            return callback(tx);
        });

        const result = await publishProviderProfile(createFormData());
        expect(result.success).toBe(true);
        expect(result.profileId).toBe(1);
        // saveProviderDraft should NOT have called profile.update (PUBLISHED short-circuit)
        expect(mockPrisma.profile.update).not.toHaveBeenCalled();
    });
});

// ──────────────────────────────────────────────────────────
// Suite 5.4 — Coordinates Requirement
// ──────────────────────────────────────────────────────────
describe('publishProviderProfile — coordinates requirement', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockAuth.mockResolvedValue({
            user: { id: 'user-1', email: 'test@example.com', name: 'Test', role: 'USER' },
        } as any);
    });

    it('rejects when profile has no coordinates (lat/lng null)', async () => {
        const draftProfile = {
            id: 1,
            slug: 'existing',
            user_id: 'user-1',
            user_email: 'test@example.com',
            name: 'Test',
            city: 'Berlin',
            status: 'DRAFT',
            attributes: {},
            languages: [],
            latitude: null,
            longitude: null,
            category_id: 1,
            provider_type: 'PRIVATE',
            address: 'Test',
            bio: 'test',
            providesInStudio: true,
            providesOutcall: false,
            outcallRadiusKm: null,
        };

        // findFirst for saveProviderDraft
        mockPrisma.profile.findFirst.mockResolvedValue(draftProfile as any);
        mockPrisma.category.findFirst.mockResolvedValue({ id: 1 } as any);
        // saveProviderDraft update
        mockPrisma.profile.update.mockResolvedValue({ id: 1 } as any);
        // findUnique for the profile check in publishProviderProfile
        mockPrisma.profile.findUnique.mockResolvedValue({
            id: 1,
            user_id: 'user-1',
            user_email: 'test@example.com',
            slug: 'existing',
            attributes: {},
            latitude: null,
            longitude: null,
        } as any);
        // taxId check passes
        mockPrisma.user.findUnique.mockResolvedValue({ taxId: 'DE123456789' } as any);

        const result = await publishProviderProfile(createFormData());
        expect(result.success).toBe(false);
        expect(result.error).toContain('адрес');
    });
});
