/**
 * Rate limiting utilities.
 * - Upstash Redis: For auth, mutations, search (existing)
 * - DB-backed: For OTP requests (new)
 */
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import prisma from '@/lib/prisma';
import { OTP_MAX_PER_HOUR } from '@/lib/otp';

// ─── Upstash Redis Rate Limits (existing) ─────────────────────────────────────

const redis = Redis.fromEnv();

// 5 attempts per 15 minutes for Login
export const loginRateLimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '15 m'),
    analytics: true,
    prefix: '@upstash/ratelimit/login',
});

// 5 attempts per 1 hour for Registration
export const registerRateLimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '1 h'),
    analytics: true,
    prefix: '@upstash/ratelimit/register',
});

// 20 requests per 1 minute for general mutations (Reviews, Profile updates)
export const mutationRateLimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, '1 m'),
    analytics: true,
    prefix: '@upstash/ratelimit/mutation',
});

// 30 requests per 1 minute for Public Search API
export const searchRateLimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, '1 m'),
    analytics: true,
    prefix: '@upstash/ratelimit/search',
});

// ─── OTP Rate Limits (DB-backed, no Redis dependency) ─────────────────────────

interface RateLimitResult {
    allowed: boolean;
    retryAfterSec?: number;
    currentCount?: number;
}

/**
 * Check if an email has exceeded the OTP rate limit.
 * Limit: OTP_MAX_PER_HOUR (default 5) OTP requests per email per rolling hour.
 */
export async function checkOtpRateLimit(email: string): Promise<RateLimitResult> {
    const windowStart = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago

    const count = await prisma.otpVerification.count({
        where: {
            email: email.toLowerCase().trim(),
            createdAt: { gte: windowStart },
        },
    });

    if (count >= OTP_MAX_PER_HOUR) {
        // Find the oldest OTP in the window to calculate retry-after
        const oldest = await prisma.otpVerification.findFirst({
            where: {
                email: email.toLowerCase().trim(),
                createdAt: { gte: windowStart },
            },
            orderBy: { createdAt: 'asc' },
            select: { createdAt: true },
        });

        const retryAfterSec = oldest
            ? Math.ceil((oldest.createdAt.getTime() + 60 * 60 * 1000 - Date.now()) / 1000)
            : 3600;

        return {
            allowed: false,
            retryAfterSec: Math.max(retryAfterSec, 0),
            currentCount: count,
        };
    }

    return { allowed: true, currentCount: count };
}

/**
 * Check if an email has too many active LOCKED bookings.
 * Limit: max 2 simultaneous locked bookings per email.
 */
export async function checkActiveLockLimit(email: string): Promise<boolean> {
    const count = await prisma.booking.count({
        where: {
            user_email: email.toLowerCase().trim(),
            status: 'LOCKED',
            lockExpiresAt: { gt: new Date() },
        },
    });

    return count < 2;
}
