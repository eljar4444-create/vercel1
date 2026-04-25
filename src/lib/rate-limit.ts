import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Validate Env vars early (falls back to localhost or throws if missing in prod)
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
