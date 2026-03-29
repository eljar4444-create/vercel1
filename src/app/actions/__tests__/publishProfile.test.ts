import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock dependencies BEFORE importing the module under test ──
vi.mock('@/lib/prisma', () => ({
    default: {
        profile: {
            findFirst: vi.fn(),
            update: vi.fn(),
        },
    },
}));

vi.mock('@/auth', () => ({
    auth: vi.fn(),
}));

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}));

import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { verifyAndPublishProfile, unpublishProfile } from '@/app/actions/publishProfile';

const mockAuth = vi.mocked(auth);
const mockPrisma = vi.mocked(prisma);

// ──────────────────────────────────────────────────────────
// Suite 4.1 — Authentication
// ──────────────────────────────────────────────────────────
describe('verifyAndPublishProfile — authentication', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('rejects unauthenticated users', async () => {
        mockAuth.mockResolvedValue(null as any);
        const result = await verifyAndPublishProfile();
        expect(result.success).toBe(false);
        expect(result.error).toContain('авторизован');
    });

    it('rejects session without user id', async () => {
        mockAuth.mockResolvedValue({ user: {} } as any);
        const result = await verifyAndPublishProfile();
        expect(result.success).toBe(false);
    });
});

// ──────────────────────────────────────────────────────────
// Suite 4.2 — Profile Completeness Gates
// ──────────────────────────────────────────────────────────
describe('verifyAndPublishProfile — completeness gates', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as any);
    });

    it('rejects when profile is not found', async () => {
        mockPrisma.profile.findFirst.mockResolvedValue(null as any);
        const result = await verifyAndPublishProfile();
        expect(result.success).toBe(false);
        expect(result.error).toContain('Профиль не найден');
    });

    it('rejects when onboardingCompleted is false (DAC7 gate)', async () => {
        mockPrisma.profile.findFirst.mockResolvedValue({
            id: 1,
            onboardingCompleted: false,
            image_url: 'https://example.com/avatar.jpg',
            services: [{ price: { toNumber: () => 50 }, duration_min: 60 }],
        } as any);

        const result = await verifyAndPublishProfile();
        expect(result.success).toBe(false);
        expect(result.error).toContain('DAC7');
    });

    it('rejects when image_url is null (no avatar)', async () => {
        mockPrisma.profile.findFirst.mockResolvedValue({
            id: 1,
            onboardingCompleted: true,
            image_url: null,
            services: [{ price: { toNumber: () => 50 }, duration_min: 60 }],
        } as any);

        const result = await verifyAndPublishProfile();
        expect(result.success).toBe(false);
        expect(result.error).toContain('фото');
    });

    it('rejects when services array is empty', async () => {
        mockPrisma.profile.findFirst.mockResolvedValue({
            id: 1,
            onboardingCompleted: true,
            image_url: 'https://example.com/avatar.jpg',
            services: [],
        } as any);

        const result = await verifyAndPublishProfile();
        expect(result.success).toBe(false);
        expect(result.error).toContain('услугу');
    });

    it('rejects when all services have zero price AND zero duration', async () => {
        mockPrisma.profile.findFirst.mockResolvedValue({
            id: 1,
            onboardingCompleted: true,
            image_url: 'https://example.com/avatar.jpg',
            services: [
                { price: { toNumber: () => -1 }, duration_min: 0 },
            ],
        } as any);

        const result = await verifyAndPublishProfile();
        expect(result.success).toBe(false);
        expect(result.error).toContain('услугу');
    });

    it('succeeds when all gates pass', async () => {
        mockPrisma.profile.findFirst.mockResolvedValue({
            id: 1,
            onboardingCompleted: true,
            image_url: 'https://example.com/avatar.jpg',
            services: [{ price: { toNumber: () => 50 }, duration_min: 60 }],
        } as any);
        mockPrisma.profile.update.mockResolvedValue({} as any);

        const result = await verifyAndPublishProfile();
        expect(result.success).toBe(true);
    });
});

// ──────────────────────────────────────────────────────────
// Suite 4.3 — Status Transitions
// ──────────────────────────────────────────────────────────
describe('verifyAndPublishProfile — status transitions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as any);
    });

    it('sets status to PENDING_REVIEW on success', async () => {
        mockPrisma.profile.findFirst.mockResolvedValue({
            id: 1,
            onboardingCompleted: true,
            image_url: 'https://example.com/avatar.jpg',
            services: [{ price: { toNumber: () => 50 }, duration_min: 60 }],
        } as any);
        mockPrisma.profile.update.mockResolvedValue({} as any);

        await verifyAndPublishProfile();

        expect(mockPrisma.profile.update).toHaveBeenCalledWith({
            where: { id: 1 },
            data: { status: 'PENDING_REVIEW' },
        });
    });
});

describe('unpublishProfile — status transition', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as any);
    });

    it('sets status to PENDING_REVIEW', async () => {
        mockPrisma.profile.findFirst.mockResolvedValue({ id: 1 } as any);
        mockPrisma.profile.update.mockResolvedValue({} as any);

        const result = await unpublishProfile();
        expect(result.success).toBe(true);
        expect(mockPrisma.profile.update).toHaveBeenCalledWith({
            where: { id: 1 },
            data: { status: 'PENDING_REVIEW' },
        });
    });
});
